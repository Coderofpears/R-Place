#!/bin/sh
# Yes, I know that this is a blatant copy of the way
# AOSP does it, although the code here was written
# from scratch for librekit, not copied from AOSP.

LIBREKIT_BUILD_TOP=$(pwd)

if [ -f "${LIBREKIT_BUILD_TOP}/build/envsetup.sh" ]
then
	export LIBREKIT_BUILD_TOP
else
	echo "Failed to find myself. Please run this script from the top of the source tree!"
fi

clean () {
	ORIGINAL_CWD=$(pwd)
	cd "${LIBREKIT_BUILD_TOP}" || return 1

	if [ "${OUTPUT_PATH}" = "" ]
	then
		OUTPUT_PATH=out
	fi

	if [ -d "${OUTPUT_PATH}" ]
	then
		echo "Cleaning ${OUTPUT_PATH}..."
		rm -rf "${OUTPUT_PATH}"
	else
		echo "No need to clean the output directory, it doesn't exist to begin with."
	fi

	cd "${ORIGINAL_CWD}" || return 1
}

ci () {
	ORIGINAL_CWD=$(pwd)
	cd "${LIBREKIT_BUILD_TOP}" || return 1

	cd frontend

	npm i
	npm run build

	cd ..

	python3 build/scripts/publish_ci_artifacts.py

	cd "${ORIGINAL_CWD}" || return 1
}

prettier () {
	ORIGINAL_CWD=$(pwd)
	cd "${LIBREKIT_BUILD_TOP}/frontend" || return 1

	npx prettier . --write

	cd "${ORIGINAL_CWD}" || return 1
}

egkf () {
	python3 "${LIBREKIT_BUILD_TOP}/build/scripts/extract_gimkit_frontend.py"
}
