"""Pure SDK result construction shared by the four modules."""

import yomihime_game_link_sdk as ygl


def success(title, lines, facts=None, *, privacy=ygl.Privacy.PUBLIC, warnings=()):
    return ygl.CapabilityResult(
        result_id="steam-dlc-result",
        status=ygl.ResultStatus.SUCCESS,
        document=ygl.DisplayDocument(
            title, "Steam DLC", tuple(ygl.TextBlock(line) for line in lines),
            privacy=privacy,
        ),
        model_facts=None if facts is None else ygl.FactDocument(facts),
        privacy=privacy,
        warnings=tuple(warnings),
    )


def failure(code, message, *, privacy=ygl.Privacy.PUBLIC):
    return ygl.CapabilityResult(
        result_id="steam-dlc-error", status=ygl.ResultStatus.ERROR,
        error=ygl.ErrorDetail(code, message), privacy=privacy,
    )
