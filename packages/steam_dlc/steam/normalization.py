"""Bounded, literal-only adapters for official Steam public responses."""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from unicodedata import category
from urllib.parse import urlsplit

VERSION = "steam-query-v2"
_HOURS = re.compile(r"(?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?:\.[0-9]+)?\Z")
_AVATAR_SOURCES = {
    "avatars.steamstatic.com": "steam_avatar",
    "avatars.fastly.steamstatic.com": "steam_avatar_fastly",
}


def avatar_source(value):
    """Validate an actual avatar metadata URL without fetching or rewriting it."""
    if (
        not isinstance(value, str)
        or not value
        or len(value) > 1000
        or any(
            character.isspace() or ord(character) < 32 or 127 <= ord(character) <= 159
            for character in value
        )
    ):
        return None
    try:
        parsed = urlsplit(value)
        if (
            parsed.scheme != "https"
            or parsed.hostname not in _AVATAR_SOURCES
            or parsed.netloc.lower() not in (parsed.hostname, parsed.hostname + ":443")
            or parsed.username is not None
            or parsed.password is not None
            or parsed.port not in (None, 443)
            or parsed.query
            or parsed.fragment
            or not re.fullmatch(r"/[0-9a-f]{40}(?:_full|_medium)?\.jpg", parsed.path)
        ):
            return None
        return _AVATAR_SOURCES[parsed.hostname], parsed.path
    except ValueError:
        return None


def _srcset_avatar(value):
    """A small static srcset subset: <=4 candidates, x or w, no mixed units.

    Steam avatars use ordinary fixed hash URLs. Reject malformed/ambiguous
    sets instead of guessing, interpreting scripts or accepting arbitrary URLs.
    """
    if not isinstance(value, str) or not value.strip() or len(value) > 4096:
        return None
    candidates = value.split(",")
    if len(candidates) > 4:
        return None
    ranked = []
    units, seen = set(), set()
    for candidate in candidates:
        tokens = candidate.split()
        if len(tokens) not in (1, 2) or avatar_source(tokens[0]) is None:
            return None
        descriptor = tokens[1] if len(tokens) == 2 else "1x"
        if re.fullmatch(r"(?:[0-9]{1,2}(?:\.[0-9]{1,3})?|\.[0-9]{1,3})x", descriptor):
            unit, rank = "x", float(descriptor[:-1])
            if not 0 < rank <= 4:
                return None
        elif re.fullmatch(r"[1-9][0-9]{0,3}w", descriptor):
            unit, rank = "w", float(descriptor[:-1])
            if rank > 2048:
                return None
        else:
            return None
        if (unit, rank) in seen:
            return None
        seen.add((unit, rank))
        units.add(unit)
        ranked.append((rank, tokens[0]))
    if len(units) != 1:
        return None
    return min(ranked)[1]


def _profile_avatar(node):
    if node is None:
        return None

    def images(current):
        if current.has("profile_avatar_frame") or current.tag in (
            "script",
            "style",
            "template",
        ):
            return
        if current.tag == "img":
            yield current
        for child in current.children:
            if isinstance(child, Node):
                yield from images(child)

    for index, candidate in enumerate(images(node)):
        if index >= 8:
            break
        source = candidate.attrs.get("src")
        if avatar_source(source) is not None:
            return source
        source = _srcset_avatar(candidate.attrs.get("srcset"))
        if source is not None:
            return source
    return None


def literal(value, limit=300):
    if not isinstance(value, str):
        return None
    return (
        " ".join("".join(c for c in value if not category(c).startswith("C")).split())[
            :limit
        ]
        or None
    )


def integer(value, maximum=2**32 - 1):
    return value if type(value) is int and 0 <= value <= maximum else None


def app_id(value):
    if not isinstance(value, str) or not re.fullmatch(r"[1-9][0-9]{0,9}", value):
        raise ValueError("AppID must be a positive decimal string")
    if int(value) > 2**32 - 1:
        raise ValueError("AppID out of range")
    return value


def hours(value):
    """Keep displayed decimal hours, never manufacture API minute precision."""
    value = literal(value, 40)
    return value.replace(",", "") if value and _HOURS.fullmatch(value) else None


def availability(data):
    return {
        key: "not_provided" if value is None else "available"
        for key, value in data.items()
    }


class Node:
    def __init__(self, tag="", attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def has(self, name):
        return name in self.attrs.get("class", "").split()

    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Node):
                yield from child.walk()

    def text(self):
        return " ".join(c.text() if isinstance(c, Node) else c for c in self.children)

    def first(self, class_name):
        return next((node for node in self.walk() if node.has(class_name)), None)


class _HTML(HTMLParser):
    _VOID = {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.count = 0

    def handle_starttag(self, tag, attrs):
        self.count += 1
        if self.count > 30000 or len(self.stack) > 100:
            raise ValueError("HTML structure exceeds bounds")
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in self._VOID:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self._VOID:
            self.handle_endtag(tag)

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def html_tree(text):
    parser = _HTML()
    parser.feed(text)
    return parser.root


def is_login_wall(text):
    return bool(
        re.search(
            r"<title>\s*Sign In|id\s*=\s*['\"]login_form['\"]|class\s*=\s*['\"][^'\"]*loginbox",
            text,
            re.I,
        )
    )


def _text(node, class_name):
    found = node.first(class_name)
    return literal(found.text()) if found else None


def _game_id(link):
    try:
        parsed = urlsplit(link or "")
        if parsed.scheme != "https" or parsed.hostname not in (
            "store.steampowered.com",
            "steamcommunity.com",
        ):
            return None
        match = re.match(r"/app/([1-9][0-9]*)(?:/|$)", parsed.path)
        return app_id(match[1]) if match else None
    except ValueError:
        return None


def normalize_profile(text, steam_id):
    if is_login_wall(text):
        raise PermissionError("Steam Community login wall")
    match = re.search(r"\bg_rgProfileData\s*=\s*", text)
    if not match:
        raise ValueError("Profile identity missing")
    identity, _ = json.JSONDecoder().raw_decode(text[match.end() :])
    if not isinstance(identity, dict) or identity.get("steamid") != steam_id:
        raise ValueError("Profile identity mismatch")
    tree = html_tree(text)
    if tree.first("profile_private_info"):
        raise PermissionError("Steam Community profile is private")
    header = tree.first("persona_level")
    raw_level = _text(header, "friendPlayerLevelNum") if header else None
    level = (
        int(raw_level) if raw_level and re.fullmatch(r"[0-9]{1,6}", raw_level) else None
    )
    avatar_node = tree.first("playerAvatarAutoSizeInner") or tree.first("playerAvatar")
    avatar = _profile_avatar(avatar_node)
    rows = []
    for node in (n for n in tree.walk() if n.has("recent_game")):
        game = node.first("game_name")
        link = (
            next((n.attrs.get("href") for n in game.walk() if n.tag == "a"), None)
            if game
            else None
        )
        detail = _text(node, "game_info_details")
        raw_hours = re.search(r"([0-9][0-9,.]*)\s+hrs? on record", detail or "")
        row = {
            "app_id": _game_id(link),
            "name": literal(game.text()) if game else None,
            "hours_on_record": hours(raw_hours[1]) if raw_hours else None,
            "hours_recent": None,
            "display_text": detail,
            "precision": "displayed_hours",
        }
        row["availability"] = availability(
            {k: row[k] for k in ("app_id", "name", "hours_on_record", "hours_recent")}
        )
        rows.append(row)
        if len(rows) == 3:
            break
    profile = {
        "steam_id64": steam_id,
        "nickname": _text(tree, "actual_persona_name")
        or literal(identity.get("personaname")),
        "avatar_url": literal(avatar, 1000),
        "level": level,
        "profile_url": f"https://steamcommunity.com/profiles/{steam_id}/",
    }
    profile["availability"] = availability(profile)
    return {
        "profile": profile,
        "games": rows,
        "sample_kind": "homepage_recently_displayed",
        "complete_library": False,
        "complete_recent_period": False,
        "availability": {
            "profile": "available",
            "games": "available" if rows else "not_provided",
        },
    }


def normalize_legacy(body, steam_id):
    if b"<!DOCTYPE" in body.upper() or b"<!ENTITY" in body.upper():
        raise ValueError("XML declarations are unsupported")
    try:
        root = ET.fromstring(body)
    except ET.ParseError as exc:
        raise ValueError("Malformed Community XML") from exc
    if root.tag != "profile" or root.findtext("steamID64") != steam_id:
        raise ValueError("Legacy profile identity mismatch")
    rows = []
    for game in root.findall("./mostPlayedGames/mostPlayedGame")[:5]:
        row = {
            "app_id": _game_id(game.findtext("gameLink")),
            "name": literal(game.findtext("gameName")),
            "hours_on_record": hours(game.findtext("hoursOnRecord")),
            "hours_recent": hours(game.findtext("hoursPlayed")),
            "precision": "displayed_hours",
        }
        row["availability"] = availability(
            {k: row[k] for k in ("app_id", "name", "hours_on_record", "hours_recent")}
        )
        rows.append(row)
    profile = {
        "steam_id64": steam_id,
        "nickname": literal(root.findtext("steamID")),
        "avatar_url": root.findtext("avatarFull")
        if avatar_source(root.findtext("avatarFull"))
        else None,
        "level": None,
        "profile_url": f"https://steamcommunity.com/profiles/{steam_id}/",
    }
    profile["availability"] = availability(profile)
    profile["availability"]["level"] = "unsupported"
    return {
        "profile": profile,
        "games": rows,
        "sample_kind": "legacy_most_played_games",
        "complete_library": False,
        "complete_recent_period": False,
        "privacy_state": literal(root.findtext("privacyState")),
        "aggregate_hours_2wk": None,
        "availability": {
            "profile": "available",
            "games": "available" if rows else "not_provided",
            "aggregate_hours_2wk": "unsupported",
        },
    }


def normalize_search(raw):
    if not isinstance(raw, dict) or not isinstance(raw.get("items"), list):
        raise ValueError("Invalid search response")
    rows = []
    for item in raw["items"][:10]:
        if not isinstance(item, dict) or item.get("type") != "app":
            continue
        try:
            value = app_id(str(item["id"]))
        except (KeyError, ValueError):
            continue
        rows.append(
            {
                "app_id": value,
                "name": literal(item.get("name")),
                "store_url": f"https://store.steampowered.com/app/{value}/",
            }
        )
    return {
        "candidates": rows,
        "returned_count": len(rows),
        "total": integer(raw.get("total")),
        "availability": {
            "candidates": "available",
            "total": "available"
            if integer(raw.get("total")) is not None
            else "not_provided",
        },
    }


def normalize_app(raw, target):
    item = raw.get(target) if isinstance(raw, dict) else None
    if not isinstance(item, dict) or item.get("success") is not True:
        raise LookupError("App unavailable in selected region or not found")
    data = item.get("data")
    if not isinstance(data, dict) or str(data.get("steam_appid")) != target:
        raise ValueError("App identity mismatch")
    price = data.get("price_overview")
    price = price if isinstance(price, dict) else {}
    release = data.get("release_date")
    release = release if isinstance(release, dict) else {}
    free = data.get("is_free") if type(data.get("is_free")) is bool else None
    final = integer(price.get("final"), 10**12)
    price_state = (
        "free"
        if free is True
        else "priced"
        if final is not None
        else "unreleased"
        if release.get("coming_soon") is True
        else "no_local_price"
    )
    result = {
        "app_id": target,
        "name": literal(data.get("name")),
        "type": literal(data.get("type"), 40),
        "is_free": free,
        "price_state": price_state,
        "currency": literal(price.get("currency"), 8),
        "initial_minor": integer(price.get("initial"), 10**12),
        "final_minor": final,
        "discount_percent": integer(price.get("discount_percent"), 100),
        "price_display": literal(price.get("final_formatted"), 80),
        "release_date": literal(release.get("date"), 100),
        "coming_soon": release.get("coming_soon")
        if type(release.get("coming_soon")) is bool
        else None,
        "developers": [
            literal(v) for v in data.get("developers", [])[:10] if literal(v)
        ]
        if isinstance(data.get("developers"), list)
        else None,
        "publishers": [
            literal(v) for v in data.get("publishers", [])[:10] if literal(v)
        ]
        if isinstance(data.get("publishers"), list)
        else None,
        "header_image_url": literal(data.get("header_image"), 1000),
        "review_summaries": None,
        "store_url": f"https://store.steampowered.com/app/{target}/",
    }
    result["availability"] = availability(result)
    return result


def normalize_reviews(text, target):
    """Scope text comes from the page; English reviews are not all reviews."""
    if is_login_wall(text):
        raise ValueError("Store login wall")
    tree = html_tree(text)
    # A matching app link is required before accepting unstructured enrichment.
    links = [n.attrs.get("href", "") for n in tree.walk() if n.tag == "a"]
    if not any(
        re.search(rf"/app/{re.escape(target)}(?:/|\?|$)", link) for link in links
    ):
        raise ValueError("Store app identity missing")
    rows = []
    for node in (n for n in tree.walk() if n.has("user_reviews_summary_row")):
        label = _text(node, "game_review_summary")
        scope = _text(node, "subtitle")
        description = literal(node.attrs.get("data-tooltip-html"), 400)
        if label and scope:
            rows.append({"scope": scope, "summary": label, "description": description})
        if len(rows) == 3:
            break
    return rows or None
