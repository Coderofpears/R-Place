# bun.mk - various bun-related build system code

ALL_MODULES += $(LOCAL_PATH)
TARGETS += $(LOCAL_OUTPUT)
LOCAL_CLEAN += $(LOCAL_OUTPUT) # we should only need to clean the output bundle that bun builds
LOCAL_DEPS += $(LOCAL_SRC)

ifneq ($(BUN_MK_ADDED),true)
RELEVANT_MAKEFILES += build/core/bun.mk
BUN_MK_ADDED := true
endif

define do-bun
$(2): $(5)
	@echo "Bun: $(2)"; sh -c "cd $(1) && if [ ! -d "$(abspath $(shell dirname $(2)))" ]; then mkdir -p "$(abspath $(shell dirname $(2)))"; fi && $(BUN) build $(3) $(4) --outfile=$(abspath $(2))"
endef

$(eval $(call do-bun,$(LOCAL_PATH),$(LOCAL_OUTPUT),$(LOCAL_BUN_ENTRYPOINT),$(LOCAL_BUN_BUILD_FLAGS),$(LOCAL_DEPS)))
$(eval $(call do-module-targets,$(LOCAL_NAME),$(LOCAL_OUTPUT),$(LOCAL_CLEAN)))

define wrapper
ALL_SRC += $(1)
ALL_CLEAN += $(2)
endef

$(eval $(call wrapper,$(LOCAL_SRC),$(LOCAL_CLEAN)))

LOCAL_NAME :=
LOCAL_SRC :=
LOCAL_OUTPUT :=
LOCAL_CLEAN :=
LOCAL_DEPS :=
LOCAL_BUN_ENTRYPOINT :=
LOCAL_BUN_BUILD_FLAGS :=
