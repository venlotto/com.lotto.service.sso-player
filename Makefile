# ── koperca-sdlc harness (generated; see koperca-sdlc/docs/STANDARDS.md) ──
KOPERCA_SDLC ?= $(HOME)/repos/koperca-sdlc
STACK        := node
APP_NAME     := com.lotto.service.sso-player
include $(KOPERCA_SDLC)/make/common.mk
include $(KOPERCA_SDLC)/make/$(STACK).mk
# ── end koperca-sdlc ─────────────────────────────────────────────────────────
