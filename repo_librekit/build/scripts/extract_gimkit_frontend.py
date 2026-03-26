# extract_gimkit_frontend.py - Downloads the official pre-built Gimkit frontend code for local testing purposes.
# IMPORTANT: ONLY use this for testing the backend server. Don't make a public librekit instance with the Gimkit frontend.
# Doing so, even if it wasn't a blatant copyright (and Gimkit ToS!) violation, is incredibly disrespectful. So don't do that.

import requests_cache
import requests
import shutil
import glob
import json
import os
import re

def download(url, output_path):
	print("Downloading:", url, "->", output_path)

	if os.path.isfile(output_path):
		return

	#print("Downloading:", url)

	response = requests.get(url, headers={
		"User-Agent": "extract_gimkit_frontend.py (https://codeberg.org/librekit/librekit)"
	})

	if response.status_code != 200:
		raise Exception(f"Expected status code 200, got {response.status_code}")

	if not os.path.isdir(os.path.dirname(output_path)):
		os.makedirs(os.path.dirname(output_path), exist_ok=True)

	f = open(output_path, "wb")
	f.seek(0)
	f.write(response.content)
	f.close()

def setup_dirs(output_directory, dirs):
	for dir in dirs:
		print("Creating:", os.path.join(output_directory, dir))
		os.makedirs(os.path.join(output_directory, dir), exist_ok=True)
		shutil.copy(os.path.join(output_directory, "index.html"), os.path.join(output_directory, dir, "index.html"))

def main():
	build_top = os.getenv("LIBREKIT_BUILD_TOP")

	if build_top == None or build_top.strip() == "":
		raise Exception("LIBREKIT_BUILD_TOP is either not set at all or incorrectly set. Please run build/envsetup.sh first!")

	output_directory = os.path.join(build_top, "out", "dist", "frontend")

	requests_cache.install_cache(os.path.join(build_top, "out", "egkf_cache"))

	if os.path.isdir(output_directory) and not os.path.isfile(os.path.join(output_directory, ".tainted")):
		shutil.rmtree(output_directory)

	os.makedirs(output_directory, exist_ok=True)

	print("Preparing...")

	f = open(os.path.join(output_directory, ".tainted"), "w")
	f.seek(0)
	f.write("yes")
	f.close()

	print("Downloading the home page...")

	download("https://www.gimkit.com", os.path.join(output_directory, "index.html"))

	# TODO: remove this once we get SPA stuff working

	print("Setting up routes...")

	setup_dirs(output_directory, ["pages/general", "me", "error", "creative", "kits", "login", "signup", "join", "host"])

	print("Extracting the JavaScript and CSS URLs from the HTML...")

	f = open(os.path.join(output_directory, "index.html"), "r")
	data = f.read()
	f.close()

	favicon = "favicon." + data.split("<link rel=\"icon\" href=\"/favicon.")[1].split("\">")[0]
	css1 = "index." + data.split("<link rel=\"stylesheet\" href=\"/index.")[1].split("\">")[0]
	css2 = "index." + data.split("<link rel=\"stylesheet\" href=\"/index.")[2].split("\">")[0]
	css3 = "index." + data.split("<link rel=\"stylesheet\" href=\"/index.")[3].split("\">")[0]
	main = "index." + data.split("<script type=\"module\" src=\"/index.")[1].split("\">")[0]
	nonesm = "index." + data.split("<script src=\"/index.")[1].split("\" nomodule defer>")[0]

	print("Favicon:", favicon)
	print("CSS 1:", css1)
	print("CSS 2:", css2)
	print("CSS 3:", css3)
	print("JS (Main):", main)
	print("JS (Non-ESM):", nonesm)

	download("https://www.gimkit.com/" + favicon, os.path.join(output_directory, favicon))
	download("https://www.gimkit.com/" + css1, os.path.join(output_directory, css1))
	download("https://www.gimkit.com/" + css2, os.path.join(output_directory, css2))
	download("https://www.gimkit.com/" + css3, os.path.join(output_directory, css3))
	download("https://www.gimkit.com/" + main, os.path.join(output_directory, main))
	download("https://www.gimkit.com/" + nonesm, os.path.join(output_directory, nonesm))

	print("Extracting and parsing the module lists...")

	f = open(os.path.join(output_directory, main), "r")
	data = f.read()
	f.close()

	main_module_list = json.loads(data.split(".register(JSON.parse('")[1].split("')")[0])

	for module in main_module_list.keys():
		download("https://www.gimkit.com/" + main_module_list[module], os.path.join(output_directory, main_module_list[module]))

	print("Extracing assets...")

	for path in glob.glob(os.path.join(output_directory, "*.js")) + glob.glob(os.path.join(output_directory, "*.css")):
		f = open(path, "r")
		data = f.read()
		f.close()

		# I COMPLETELY REFUSE TO USE REGEX
		# SO I WILL DO CHARACTER-BY-CHARACTER STRING EXTRACTION
		# MWAHAHAHAHAHA

		i = 0

		while len(data) > i:
			if i > 0 and data[i] == "/" and (data[i - 1] == "'" or data[i - 1] == "\""):
				buf = ""

				while data[i] != "'" and data[i] != "\"" and len(data) > i:
					buf += data[i]
					i += 1

				if buf.endswith(".svg") or buf.endswith(".png") or buf.endswith(".jpg") or buf.endswith(".jpeg") or buf.endswith(".webp") or buf.endswith(".wav") or buf.endswith(".mp3") or buf.endswith(".ogg") or buf.endswith(".otf"):
					download("https://www.gimkit.com" + buf, os.path.join(output_directory, buf[1:]))

				continue

			if i > 2 and data[i] == "(" and data[i - 1] == "l" and data[i - 2] == "r" and data[i - 3] == "u":
				buf = ""

				i += 1

				while data[i] != ")" and len(data) > i:
					buf += data[i]
					i += 1

				if buf.startswith("/"):
					download("https://www.gimkit.com" + buf, os.path.join(output_directory, buf[1:])) # it's a absolute path.
					continue

				if buf.startswith("'/"):
					download("https://www.gimkit.com" + buf[1:-1], os.path.join(output_directory, buf[2:-1])) # it's a absolute path with quotation.
					continue

				if buf.endswith(".png") or buf.endswith(".jpg") or buf.endswith(".jpeg") or buf.endswith(".ttf") or buf.endswith(".otf"):
					if buf.startswith("<"):
						continue

					download("https://www.gimkit.com/" + buf, os.path.join(output_directory, buf)) # it's a relative path.
					continue

				#print(buf)

				continue

			i += 1

if __name__ == "__main__":
	main()
