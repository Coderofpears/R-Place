# generic.mk - a generic module template

ALL_MODULES += $(LOCAL_PATH)

ifneq ($(GENERIC_MK_ADDED),true)
RELEVANT_MAKEFILES += build/core/generic.mk
GENERIC_MK_ADDED := true
endif

define wrapper
ALL_SRC += $(1)
ALL_CLEAN += $(2)
endef

$(eval $(call wrapper,$(LOCAL_SRC),$(LOCAL_CLEAN)))
$(eval $(call do-module-targets,$(LOCAL_NAME),$(LOCAL_OUTPUT),$(LOCAL_CLEAN)))

LOCAL_NAME :=
LOCAL_SRC :=
LOCAL_OUTPUT :=
LOCAL_CLEAN :=
LOCAL_DEPS :=
