"""Independent complete DLC builds and non-destructive publication boundaries."""

import base64
import contextlib
import hashlib
import importlib.util
import io
import json
import os
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "standalone_dlc_release", ROOT / "scripts/build_release.py"
)
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class CompleteDLCReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name).resolve()
        self.output = self.directory / "dlc.zip"

    def build(self, **kwargs):
        with contextlib.redirect_stdout(io.StringIO()):
            return release.build(output=self.output, allow_dirty=True, **kwargs)

    def test_unsigned_complete_inventory_checksum_and_repeat_identity(self):
        self.build()
        original = self.output.read_bytes()
        self.build()
        self.assertEqual(original, self.output.read_bytes())
        with zipfile.ZipFile(self.output) as archive:
            names = set(archive.namelist())
            doc = json.loads(archive.read("release.json"))
            self.assertNotIn("release.sig.json", names)
            self.assertEqual(
                set(row["path"] for row in doc["files"]), names - {"release.json"}
            )
            self.assertEqual(
                doc["plugin_id"],
                {
                    "author": "yomihime",
                    "name": "astrbot_plugin_yomihime_game_link_steam_dlc",
                },
            )
            self.assertEqual(
                (doc["release"], doc["channel"], doc["release_sequence"]),
                ("0.3.0", "preview", 1),
            )
            for row in doc["files"]:
                content = archive.read(row["path"])
                self.assertEqual(
                    (row["size"], row["sha256"]),
                    (len(content), hashlib.sha256(content).hexdigest()),
                )
            self.assertFalse(
                any(name.startswith("yomihime_game_link_sdk/") for name in names)
            )
            self.assertIn("packages/steam_dlc/yomihime.source-policy.json", names)
        self.assertLess(len(original), 16_000_000)
        self.assertIn(
            hashlib.sha256(original).hexdigest(),
            (self.directory / "SHA256SUMS").read_text(),
        )

    def test_signed_dlc_signs_exact_raw_release(self):
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

        key = Ed25519PrivateKey.generate()
        self.build(signing_key=key)
        with zipfile.ZipFile(self.output) as archive:
            raw = archive.read("release.json")
            sig = json.loads(archive.read("release.sig.json"))
            key.public_key().verify(base64.b64decode(sig["signature_base64"]), raw)
            self.assertEqual(set(sig), {"algorithm", "key_id", "signature_base64"})
            self.assertNotIn("release-key.json", archive.namelist())

    def test_checksum_link_preflight_preserves_archive_and_target(self):
        self.output.write_bytes(b"previous archive")
        target = self.directory / "target"
        target.write_bytes(b"private target")
        os.link(target, self.directory / "SHA256SUMS")
        with self.assertRaisesRegex(ValueError, "link"):
            self.build()
        self.assertEqual(self.output.read_bytes(), b"previous archive")
        self.assertEqual(target.read_bytes(), b"private target")

    def test_zip_hardlink_and_symlink_are_rejected(self):
        target = self.directory / "target"
        target.write_bytes(b"private target")
        for link in ("hard", "symbolic"):
            with self.subTest(link=link):
                if link == "hard":
                    os.link(target, self.output)
                else:
                    self.output.symlink_to(target)
                try:
                    with self.assertRaisesRegex(ValueError, "link"):
                        self.build()
                    self.assertEqual(target.read_bytes(), b"private target")
                finally:
                    self.output.unlink()

    def test_source_mutation_prevents_all_publication(self):
        original = release.inventory(ROOT)
        changed = {**original, "README.md": b"changed"}
        with (
            patch.object(release, "inventory", side_effect=[original, changed]),
            self.assertRaisesRegex(ValueError, "source changed"),
        ):
            self.build()
        self.assertFalse(self.output.exists())
        self.assertFalse((self.directory / "SHA256SUMS").exists())

    def test_source_and_checksum_overlap_cannot_write_inputs(self):
        original = (ROOT / "README.md").read_bytes()
        self.output = ROOT / "packages/.." / "README.md"
        with self.assertRaisesRegex(ValueError, "overlaps"):
            self.build()
        self.assertEqual((ROOT / "README.md").read_bytes(), original)
        self.output = self.directory / "SHA256SUMS"
        with self.assertRaisesRegex(ValueError, "distinct"):
            self.build()
