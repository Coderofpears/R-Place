import os

def main():
	build_top = os.getenv("LIBREKIT_BUILD_TOP")

	if build_top == None or build_top.strip() == "":
		raise Exception("LIBREKIT_BUILD_TOP is either not set at all or incorrectly set. Please run build/envsetup.sh first!")

	output_directory = os.path.join(build_top, "out", "dist", "frontend")

	if os.path.isfile(os.path.join(output_directory, ".tainted")):
		print("yes")
	else:
		print("no")

if __name__ == "__main__":
	main()
