# copy.mk - tools for file copying
# WARNING: This is NOT a module template. If you don't need anything else, just use $(GENERIC_MODULE)

define wrapper
LOCAL_SRC += $(1)
LOCAL_DEPS += $(1)
LOCAL_OUTPUT += $(2)
LOCAL_CLEAN += $(2)
endef

$(eval $(call wrapper,$(LOCAL_COPY_SRC),$(LOCAL_COPY_OUTPUT)))

TARGETS += $(LOCAL_COPY_OUTPUT)

ifneq ($(COPY_MK_ADDED),true)
RELEVANT_MAKEFILES += build/core/copy.mk
COPY_MK_ADDED := true
endif

define do-copy
$(2): $(1)
	@echo "Copy: $(1) -> $(2)"; if [ ! -d "$$(shell dirname $(2))" ]; then mkdir -p "$$(shell dirname $(2))"; fi; cp -r "$(1)" "$(2)"
endef

$(eval $(call do-copy,$(LOCAL_COPY_SRC),$(LOCAL_COPY_OUTPUT)))

LOCAL_COPY_SRC :=
LOCAL_COPY_OUTPUT :=
