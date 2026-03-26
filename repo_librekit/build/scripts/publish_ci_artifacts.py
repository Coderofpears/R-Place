import subprocess
import disnake
import glob
import os

def main():
	output_path = "out"

	if "OUTPUT_PATH" in os.environ:
		output_path = os.environ["OUTPUT_PATH"]

	tarball_glob = glob.glob(os.path.join(output_path, "librekit-*.tar.gz"))

	if len(tarball_glob) != 1:
		tarball_count = len(tarball_glob)
		print(f"ERROR: Expected 1 tarball, got {tarball_count}")
		exit(1)

	tarball_path = tarball_glob[0]

	client = disnake.Client()

	@client.event
	async def on_ready():
		print(f"Logged in as {client.user}!")

		for channelID in [
			1208264467163390033, # tgtc #librekit-general
			1242527126922727498 # rebirth #librekit
		]:
			channel = client.get_channel(channelID)
			await channel.send(subprocess.getoutput("git log -1 --format=\"New librekit CI build! :tada:%nCommit details:%n\tCommit hash: [%H](https://codeberg.org/librekit/librekit/commit/%H)%n\tAuthor: **%an <%ae>**%n\tCommitter: **%cn <%ce>**%n\tSubject: **%s**\""), file=disnake.File(tarball_path))
		
		exit()

	client.run(os.environ["DISCORD_TOKEN"])

if __name__ == "__main__":
	main()
