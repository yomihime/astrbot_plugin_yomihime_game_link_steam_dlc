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

    def versioned_files(self, version):
        files = release.inventory(ROOT)
        path = "packages/steam_dlc/yomihime.manifest.json"
        manifest = json.loads(files[path])
        original = manifest["package_version"].encode()
        for name in ("main.py", "metadata.yaml", path):
            files[name] = files[name].replace(original, version.encode())
        files["README.md"] = b"Release documentation is maintained separately.\n"
        return files

    def test_ordinary_complete_inventory_checksum_and_repeat_identity(self):
        self.build()
        original = self.output.read_bytes()
        self.build()
        self.assertEqual(original, self.output.read_bytes())
        with zipfile.ZipFile(self.output) as archive:
            names = set(archive.namelist())
            doc = json.loads(archive.read("release.json"))
            self.assertTrue({"release.sig.json", "release-key.json"}.isdisjoint(names))
            self.assertEqual(
                set(doc),
                {
                    "schema",
                    "plugin_id",
                    "package_id",
                    "release",
                    "payload_digest",
                    "files",
                },
            )
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
                (doc["schema"], doc["package_id"], doc["release"]),
                ("ygl.release/2", "steam_dlc", "0.3.1"),
            )
            for row in doc["files"]:
                content = archive.read(row["path"])
                self.assertEqual(
                    (row["size"], row["sha256"]),
                    (len(content), hashlib.sha256(content).hexdigest()),
                )
            records = "".join(
                f"{row['path']}\0{row['size']}\0{row['sha256']}\n"
                for row in sorted(doc["files"], key=lambda row: row["path"].encode())
            )
            self.assertEqual(
                doc["payload_digest"], hashlib.sha256(records.encode()).hexdigest()
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
        self.build(signing_key=key, channel="stable", sequence=42)
        with zipfile.ZipFile(self.output) as archive:
            raw = archive.read("release.json")
            doc = json.loads(raw)
            sig = json.loads(archive.read("release.sig.json"))
            self.assertEqual(
                (doc["schema"], doc["channel"], doc["release_sequence"]),
                ("ygl.release/1", "stable", 42),
            )
            key.public_key().verify(base64.b64decode(sig["signature_base64"]), raw)
            self.assertEqual(set(sig), {"algorithm", "key_id", "signature_base64"})
            self.assertNotIn("release-key.json", archive.namelist())

    def test_ordinary_release_uses_semver_without_readme_version_gate(self):
        for version in ("1.2.3-beta.4+build.07", "10.20.30-rc.1"):
            with self.subTest(version=version):
                files = self.versioned_files(version)
                release.validate_version_declarations(files)
                payload = release._ENVELOPE.complete(files, ROOT, "dlc")
                with zipfile.ZipFile(io.BytesIO(payload)) as archive:
                    doc = json.loads(archive.read("release.json"))
                    self.assertEqual(
                        (doc["schema"], doc["release"]), ("ygl.release/2", version)
                    )

    def test_ordinary_release_rejects_invalid_semver_and_legacy_keeps_numeric(self):
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

        for version in (
            "01.2.3",
            "1.2.3-beta.04",
            "1.2.3-beta..4",
            "1.2.3+",
            "1.2.3+" + "a" * 123,
        ):
            with self.subTest(version=version):
                files = self.versioned_files(version)
                with self.assertRaisesRegex(ValueError, "semantic version"):
                    release.validate_version_declarations(files)
        with self.assertRaisesRegex(ValueError, "legacy release requires numeric"):
            release._ENVELOPE.complete(
                self.versioned_files("1.2.3-beta.4+build.07"),
                ROOT,
                "dlc",
                signing_key=Ed25519PrivateKey.generate(),
            )

    def test_legacy_release_options_require_signing(self):
        for options in ({"channel": "preview"}, {"sequence": 1}):
            with (
                self.subTest(options=options),
                self.assertRaisesRegex(ValueError, "require legacy signing"),
            ):
                self.build(**options)
        self.assertFalse(self.output.exists())

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
