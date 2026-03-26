# astro.mk - various astro-related build system code

ALL_MODULES += $(LOCAL_PATH)
TARGETS += $(LOCAL_OUTPUT)
RELEVANT_MAKEFILES += build/core/astro.mk
LOCAL_CLEAN += $(LOCAL_OUTPUT) # we should only need to clean the output directory that astro builds
LOCAL_DEPS += $(LOCAL_SRC)

ifneq ($(ASTRO_MK_ADDED),true)
RELEVANT_MAKEFILES += build/core/astro.mk
ASTRO_MK_ADDED := true
endif

define do-astro
$(2): $(3)
	@echo "Astro: $(2)"; sh -c "cd $(1); if [ -d "$(abspath $(2))" ]; then rm -rf "$(abspath $(2))"; fi && $(BUN) x astro check && $(BUN) x astro build --outDir $(abspath $(2))"
endef

$(eval $(call do-astro,$(LOCAL_PATH),$(LOCAL_OUTPUT),$(LOCAL_DEPS)))
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
