"""Exercise release boundaries with hostile declarations and changed assets."""

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from yomihime_game_link_sdk.contexts import InvocationOrigin
from yomihime_game_link_sdk.declarations import (
    CapabilityDescriptor,
    CapabilityEffect,
    InvocationPolicy,
    PrivacyFloor,
)

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "dlc_release", ROOT / "scripts/build_release.py"
)
assert spec is not None and spec.loader is not None
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ReleaseResourcesTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="steam-dlc-release-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()
        self.package = self.root / "packages/steam_dlc"
        originals = [ROOT / name for name in release.ROOT_FILES]
        originals += [ROOT / "packages/__init__.py"]
        originals += list((ROOT / "packages/steam_dlc").rglob("*.py"))
        for path in originals:
            target = self.root / path.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(path.read_bytes())
        self.manifest = json.loads(
            (ROOT / "packages/steam_dlc/yomihime.manifest.json").read_bytes()
        )
        for module in self.manifest["modules"]:
            module.pop("pages", None)
            module.pop("resources", None)
            module.get("display", {}).pop("logo_resource", None)
        self.asset = self.package / "pages/steam/entry.js"
        self.asset.parent.mkdir(parents=True)
        self.asset.write_bytes(b"export function mount() {}\n")
        self.module = self.manifest["modules"][0]
        self.module["resources"] = [
            {
                "path": "pages/steam/entry.js",
                "sha256": hashlib.sha256(self.asset.read_bytes()).hexdigest(),
            }
        ]
        self.module["pages"] = [{"entry": "pages/steam/entry.js"}]
        self.save_manifest()

    def save_manifest(self):
        (self.package / "yomihime.manifest.json").write_text(
            json.dumps(self.manifest), encoding="utf-8"
        )

    def test_only_declared_assets_are_included(self):
        (self.asset.parent / "private.txt").write_text("excluded", encoding="utf-8")
        files = release.inventory(self.root)
        self.assertIn("packages/steam_dlc/pages/steam/entry.js", files)
        self.assertFalse(any(name.endswith("private.txt") for name in files))
        self.assertEqual(
            files["packages/steam_dlc/pages/steam/entry.js"], self.asset.read_bytes()
        )

    def add_logo(self):
        relative = "steam/assets/steam.svg"
        logo = self.package / relative
        logo.parent.mkdir(parents=True, exist_ok=True)
        logo.write_bytes(b'<svg xmlns="http://www.w3.org/2000/svg"/>')
        self.module["display"]["logo_resource"] = relative
        self.module["resources"].append(
            {"path": relative, "sha256": hashlib.sha256(logo.read_bytes()).hexdigest()}
        )
        self.save_manifest()
        return logo

    def test_declared_logo_is_included_and_digest_checked(self):
        logo = self.add_logo()
        files = release.inventory(self.root)
        self.assertEqual(
            files["packages/steam_dlc/steam/assets/steam.svg"], logo.read_bytes()
        )
        logo.write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "bytes differ"):
            release.inventory(self.root)

    def test_logo_reference_must_be_declared_and_owner_scoped(self):
        self.add_logo()
        for path in ("cs2/assets/cs2.svg", "../steam.svg", "https://invalid/logo.svg"):
            with self.subTest(path=path):
                self.module["display"]["logo_resource"] = path
                self.save_manifest()
                with self.assertRaisesRegex(ValueError, "allowlist"):
                    release.inventory(self.root)
        self.module["display"]["logo_resource"] = "steam/assets/steam.svg"
        self.module["resources"].pop()
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, "references"):
            release.inventory(self.root)

    def test_unreferenced_and_cross_owner_logo_resources_are_rejected(self):
        self.add_logo()
        del self.module["display"]["logo_resource"]
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, "references"):
            release.inventory(self.root)
        self.module["resources"][-1]["path"] = "cs2/assets/cs2.svg"
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, "allowlist"):
            release.inventory(self.root)

    def test_shipped_logos_are_exactly_four_pinned_passive_svgs(self):
        from xml.etree import ElementTree

        files = release.inventory(ROOT)
        manifest = json.loads(files["packages/steam_dlc/yomihime.manifest.json"])
        logos = set()
        allowed = {"svg", "title", "desc", "path", "circle", "rect", "g"}
        for module in manifest["modules"]:
            relative = module["display"]["logo_resource"]
            logos.add(relative)
            payload = files["packages/steam_dlc/" + relative]
            declared = next(r for r in module["resources"] if r["path"] == relative)
            self.assertEqual(hashlib.sha256(payload).hexdigest(), declared["sha256"])
            svg = ElementTree.fromstring(payload)
            self.assertEqual(svg.attrib["viewBox"], "0 0 100 100")
            self.assertEqual(svg.attrib["fill"], "currentColor")
            for element in svg.iter():
                self.assertIn(element.tag.split("}")[-1], allowed)
                self.assertFalse(
                    any(
                        name.lower().startswith("on") or "href" in name.lower()
                        for name in element.attrib
                    )
                )
        self.assertEqual(len(logos), 4)
        self.assertEqual(
            {
                name.removeprefix("packages/steam_dlc/")
                for name in files
                if name.endswith(".svg")
            },
            logos,
        )

    def test_matching_public_versions_are_accepted(self):
        files = release.inventory(self.root)
        release.validate_version_declarations(files)

    def test_mismatched_register_version_is_rejected(self):
        main = self.root / "main.py"
        original = main.read_text(encoding="utf-8")
        version = self.manifest["package_version"]
        self.assertIn(version, original)
        mismatched = original.replace(version, f"{version}-mismatch")
        self.assertNotEqual(original, mismatched)
        main.write_text(
            mismatched,
            encoding="utf-8",
        )
        with self.assertRaisesRegex(ValueError, "register version"):
            release.inventory(self.root)

    def test_local_process_paths_cannot_reenter_public_inputs(self):
        for path in (
            "AGENTS.md",
            "docs/plan.md",
            "docs/collaboration.md",
            ".local-dev/ai/prompt.md",
            "packages/steam_dlc/.local-dev/private.py",
        ):
            with self.subTest(path=path):
                with self.assertRaisesRegex(ValueError, "local development material"):
                    release.validate_public_paths((path,))
        release.validate_public_paths(
            ("docs/architecture.md", "packages/steam_dlc/runtime_prompt.py")
        )

    def test_recursive_python_collection_rejects_local_development_material(self):
        local = self.package / ".local-dev/private.py"
        local.parent.mkdir()
        local.write_text("# development only\n", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "local development material"):
            release.inventory(self.root)

    def test_changed_resource_fails_closed(self):
        self.asset.write_bytes(b"changed after manifest digest\n")
        with self.assertRaisesRegex(ValueError, "bytes differ"):
            release.inventory(self.root)

    def test_escaping_or_cross_owner_declarations_are_rejected(self):
        for path in (
            "../../README.md",
            "pages/dota2/entry.js",
            "pages/steam/private.txt",
        ):
            with self.subTest(path=path):
                self.module["resources"][0]["path"] = path
                self.module["pages"][0]["entry"] = path
                self.save_manifest()
                with self.assertRaisesRegex(ValueError, "allowlist"):
                    release.inventory(self.root)

    def test_undeclared_page_entry_is_rejected(self):
        self.module["pages"][0]["entry"] = "pages/steam/missing.js"
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, "references"):
            release.inventory(self.root)

    def test_duplicate_resource_and_hardlink_are_rejected(self):
        self.module["resources"] *= 2
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, "allowlist"):
            release.inventory(self.root)
        self.module["resources"] = self.module["resources"][:1]
        self.save_manifest()
        self.asset.with_suffix(".alias").hardlink_to(self.asset)
        with self.assertRaisesRegex(ValueError, "regular file"):
            release.inventory(self.root)

    def test_tool_allowlist_requires_explicit_targets_for_cs2_and_steam(self):
        cs2 = next(
            module
            for module in self.manifest["modules"]
            if module["module_id"] == "cs2"
        )
        cs2["tools"] = [{"name": "steam_dlc_cs2_profile", "capability_id": "profile"}]
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, "unsupported tools"):
            release.inventory(self.root)
        cs2["tools"] = []
        tool = self.module["tools"][0]
        capability = next(
            item
            for item in self.module["capabilities"]
            if item["capability_id"] == tool["capability_id"]
        )
        capability["input_schema"]["required"] = []
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, "explicit public target"):
            release.inventory(self.root)

    def test_model_tool_fields_and_actions_are_atomic_and_fixed(self):
        dota2 = next(
            module
            for module in self.manifest["modules"]
            if module["module_id"] == "dota2"
        )
        original_description = dota2.pop("model_tool_description")
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, "must be paired"):
            release.inventory(self.root)

        dota2["model_tool_description"] = original_description
        dota2["tools"][0]["action"] = "profile"
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, "fixed mapping"):
            release.inventory(self.root)

        dota2.pop("model_tool_name")
        dota2.pop("model_tool_description")
        self.save_manifest()
        with self.assertRaisesRegex(ValueError, "requires one aggregate"):
            release.inventory(self.root)

    def test_registered_tools_have_public_read_only_dependency_closure(self):
        capabilities = {
            (
                "steam_dlc/" + module["module_id"],
                capability["capability_id"],
            ): capability
            for module in self.manifest["modules"]
            for capability in module["capabilities"]
        }
        for module in self.manifest["modules"]:
            for tool in module["tools"]:
                pending = [("steam_dlc/" + module["module_id"], tool["capability_id"])]
                seen = set()
                while pending:
                    key = pending.pop()
                    if key in seen:
                        continue
                    seen.add(key)
                    capability = capabilities[key]
                    descriptor = CapabilityDescriptor(
                        capability_id=key[1],
                        input_schema=capability["input_schema"],
                        invocation_policy=InvocationPolicy(
                            capability["invocation_policy"]
                        ),
                        effect=CapabilityEffect(capability["effect"]),
                        privacy_floor=PrivacyFloor(
                            capability.get("privacy_floor", "public")
                        ),
                        invocation_origins=(
                            tuple(
                                map(InvocationOrigin, capability["invocation_origins"])
                            )
                            if "invocation_origins" in capability
                            else None
                        ),
                    )
                    with self.subTest(tool=tool["name"], dependency=key):
                        self.assertIs(descriptor.effect, CapabilityEffect.READ_ONLY)
                        self.assertIs(descriptor.privacy_floor, PrivacyFloor.PUBLIC)
                        self.assertIn(
                            InvocationOrigin.LLM_TOOL, descriptor.effective_origins
                        )
                    for dependency in capability.get("required_capabilities", []):
                        pending.append(
                            (key[0], dependency)
                            if isinstance(dependency, str)
                            else (dependency["module_id"], dependency["capability_id"])
                        )
