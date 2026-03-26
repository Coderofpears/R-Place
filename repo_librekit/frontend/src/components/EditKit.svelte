<script lang="ts">
	// todo list of stuff that needs to be implemented that hasn't been yet
	// it's pretty large atm since i mainly focused on the layouts rather than functionality
	// but i'll get working on functionality soon too

	// in "add question" menu
	// support different number of possible answers
	// support multiple text input answers
	// support adding audio, image, and equation inputs

	// in "import from flashcards"
	// support adding audio, image, and equation inputs
	// support adding more than four questions at once
	// actually make the flashcard maker (has to be dynamic so that sucks :/ )

	// on each question:
	// support editing questions
	// add edit button
	// support select + deleting multtiple questions at once
	// add delete button
	// add dulplace button

	// support spreadsheets, kitcollab, question bank
	// and of course, make everything actually function

	import API from "$lib/lkcore/api";
	import type { IKit } from "$lib/types";
	import { getConfig } from "$lib/utils/config";
	import { onMount } from "svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Tabs from "$lib/components/ui/tabs";
	import { Input } from "$lib/components/ui/input";
	import * as Select from "$lib/components/ui/select";
	import { Textarea } from "$lib/components/ui/textarea";
	import TrashCanOutline from "svelte-material-icons/TrashCanOutline.svelte";

	const urlParams = new URLSearchParams(window.location.search);
	const kitID = urlParams.get("id");

	const config = getConfig();
	const api = new API(config.apiBase);

	// Load the kit
	async function fetchKit(kitID: any) {
		let kit = await api.get("/api/games/fetch/" + kitID);
		return kit.kit as IKit;
	}
	let kit: IKit;
	onMount(async () => {
		kit = await fetchKit(kitID);
		console.log(kit);
	});

	// ADD QUESTION BUTTON SCRIPTS

	let AddQuestionDialogOpen = false;

	//function to add a question based on some data
	async function addQuestion(questionText: string, answers: any, type: string) {
		if (type == "text") {
			answers = [
				{
					correct: true,
					text: answers,
					_id: Math.random().toString(),
					textType: parseInt(textAnswerType)
				}
			];
		} else if (type == "mc") {
			let compiledAnswers = [];
			for (let answer of answers) {
				compiledAnswers.push({
					correct: answer[1],
					text: answer[0],
					_id: Math.random().toString()
				});
			}
			answers = compiledAnswers;
		}

		let data = {
			questions: [
				{
					audio: "",
					image: "",
					kitId: kitID,
					questionText: questionText,
					replacingQuestion: "",
					source: "editor",
					type: type, // this will be either "mc" or "text"
					answers: answers
				}
			]
		};

		await api.post("/api/v1/editor/questions/add", data);

		// wipe all the options so the use can add another question if they want
		questionType = "mc";
		questionText = "";
		MCanswers = [
			["", "correct"],
			["", "incorrect"],
			["", "incorrect"],
			["", "incorrect"]
		];
		textAnswer = "";
		textAnswerType = 1;

		// refetch the kit
		kit = await fetchKit(kitID);
	}

	// varaibles that store the question inputs
	let questionType: string = "mc";
	let questionText: string = "";
	let MCanswers: any[] = [
		["", true],
		["", false],
		["", false],
		["", false]
	];
	let textAnswer: string = "";
	let textAnswerType: any = 1;

	// checks for if the question inputs are valid
	$: inputTypesValid =
		MCanswers[0][1] || MCanswers[1][1] || MCanswers[2][1] || MCanswers[3][1];
	$: mcInputsFilled = ![
		MCanswers[0][0],
		MCanswers[1][0],
		MCanswers[2][0],
		MCanswers[3][0]
	].includes("");
	$: inputValid =
		(inputTypesValid &&
			questionText != "" &&
			questionType == "mc" &&
			mcInputsFilled) ||
		(questionType == "text" && !(textAnswer == ""));

	//this function literally just helps set the question type and text answer type
	function setAddQuestionParameter(
		param: string,
		value: any,
		optionalParam: any = null
	) {
		if (param == "questionType") {
			questionType = value;
		}
		if (param == "textAnswerType") {
			textAnswerType = value.value;
		}
	}

	// QUESTION REMOVAL

	//whether the delete question dialog is open
	let deleteQuestionDialogOpen = false;

	// a function to remove questions
	async function removeQuestions(questionIDs: string[]) {
		await api.post("/api/v1/editor/questions/remove", {
			questions: questionIDs,
			kitId: kitID
		});

		// refetch the kit
		kit = await fetchKit(kitID);
	}
</script>

<div>
	{#if kit}
		<img
			src={kit.gif}
			alt={kit.title}
			class="w-60 h-60 object-cover rounded-xl"
		/>
		<h1 class="text-7xl mt-4 mb-1">{kit.title}</h1>
		<h1 class="text-xl mb-6 ml-1">{kit.questions.length} questions</h1>
		<div class="grid grid-cols-5 gap-6 mt-5">
			<div class="grid-cols-1 h-12 w-full">
				<Dialog.Root bind:open={AddQuestionDialogOpen}>
					<Dialog.Trigger class="w-full">
						<Button
							class="h-12 w-full"
							variant="outline"
							on:click={() => (AddQuestionDialogOpen = true)}
							>Add Question</Button
						>
					</Dialog.Trigger>
					<Dialog.Content>
						<Tabs.Root
							value="mc"
							class="w-[400px] h-[500px]"
							onValueChange={(value) =>
								setAddQuestionParameter("questionType", value)}
						>
							<Tabs.List>
								<Tabs.Trigger value="mc">Multiple Choice</Tabs.Trigger>
								<Tabs.Trigger value="text">Text Input</Tabs.Trigger>
							</Tabs.List>

							<h1 class="text-3xl mb-2 mt-4">Question</h1>
							<Input
								id="question"
								placeholder="Ask away..."
								autocomplete="one-time-code"
								bind:value={questionText}
							/>

							<Tabs.Content value="mc">
								<h1 class="text-3xl mb-2 mt-4">Answers</h1>
								<div class="flex flex-row">
									<button
										class="text-3xl mr-2 mt-[-16px]"
										on:click={() => (MCanswers[0][1] = !MCanswers[0][1])}
										>{MCanswers[0][1] == 1 ? "✅" : "❌"}</button
									>
									<Input
										id="answer1"
										class="mb-3"
										placeholder={MCanswers[0][1] == 1
											? "Correct Answer"
											: "Incorrect Answer"}
										autocomplete="one-time-code"
										bind:value={MCanswers[0][0]}
									/>
								</div>
								<div class="flex flex-row">
									<button
										class="text-3xl mr-2 mt-[-16px]"
										on:click={() => (MCanswers[1][1] = !MCanswers[1][1])}
										>{MCanswers[1][1] == 1 ? "✅" : "❌"}</button
									>
									<Input
										id="answer2"
										class="mb-3"
										placeholder={MCanswers[1][1] == 1
											? "Correct Answer"
											: "Incorrect Answer"}
										autocomplete="one-time-code"
										bind:value={MCanswers[1][0]}
									/>
								</div>
								<div class="flex flex-row">
									<button
										class="text-3xl mr-2 mt-[-16px]"
										on:click={() => (MCanswers[2][1] = !MCanswers[2][1])}
										>{MCanswers[2][1] == 1 ? "✅" : "❌"}</button
									>
									<Input
										id="answer3"
										class="mb-3"
										placeholder={MCanswers[2][1] == 1
											? "Correct Answer"
											: "Incorrect Answer"}
										autocomplete="one-time-code"
										bind:value={MCanswers[2][0]}
									/>
								</div>
								<div class="flex flex-row">
									<button
										class="text-3xl mr-2 mt-[-16px]"
										on:click={() => (MCanswers[3][1] = !MCanswers[3][1])}
										>{MCanswers[3][1] == 1 ? "✅" : "❌"}</button
									>
									<Input
										id="answer4"
										class="mb-3"
										placeholder={MCanswers[3][1] == 1
											? "Correct Answer"
											: "Incorrect Answer"}
										autocomplete="one-time-code"
										bind:value={MCanswers[3][0]}
									/>
								</div>
							</Tabs.Content>

							<Tabs.Content value="text">
								<h1 class="text-3xl mb-2 mt-4">Answer</h1>
								<div class="flex flex-row">
									<Select.Root
										onSelectedChange={(value) =>
											setAddQuestionParameter("textAnswerType", value)}
									>
										<Select.Trigger class="w-[160px]">
											<Select.Value placeholder="Is Exactly" />
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="1">Is Exactly</Select.Item>
											<Select.Item value="2">Contains</Select.Item>
										</Select.Content>
									</Select.Root>
									<Input
										id="textanswer"
										class="mb-3 ml-3"
										placeholder="Correct Answer"
										autocomplete="one-time-code"
										bind:value={textAnswer}
									/>
								</div>
							</Tabs.Content>

							<Button
								class="mt-2"
								variant="secondary"
								disabled={!inputValid}
								on:click={() => {
									addQuestion(
										questionText,
										questionType == "mc" ? MCanswers : textAnswer,
										questionType
									);
									AddQuestionDialogOpen = false;
								}}
							>
								Add Question
							</Button>
						</Tabs.Root>
					</Dialog.Content>
				</Dialog.Root>
			</div>
			<div class="grid-cols-1 h-12 w-full">
				<Dialog.Root>
					<Dialog.Trigger class="w-full">
						<Button class="h-12 w-full" variant="outline">
							Create with Flashcards
						</Button>
					</Dialog.Trigger>
					<Dialog.Content>
						<Tabs.Root value="createflashcards" class="w-[400px] h-[500px]">
							<Tabs.List>
								<Tabs.Trigger value="createflashcards">
									Create Flashcards
								</Tabs.Trigger>
								<Tabs.Trigger value="importflashcards">
									Import Flashcards
								</Tabs.Trigger>
							</Tabs.List>

							<Tabs.Content value="createflashcards">
								<h1 class="text-3xl">Create Flashcards</h1>
								<h1 class="mb-2">
									Save some time by entering a question and answer. We'll
									generate the incorrect answers for you!
								</h1>
							</Tabs.Content>

							<Tabs.Content value="importflashcards">
								<h1 class="text-3xl">Import a Set</h1>
								<h1 class="mb-2">
									Find a flashcard set and paste the text below
								</h1>
								<Textarea placeholder="Paste here..." class="h-80" />
							</Tabs.Content>
						</Tabs.Root>
					</Dialog.Content>
				</Dialog.Root>
			</div>
			<Button class="grid-cols-1 h-12" variant="outline">
				Collaborate with KitCollab
			</Button>
			<Button class="grid-cols-1 h-12" variant="outline">
				Add from Question Bank
			</Button>
			<div class="grid-cols-1 h-12 w-full">
				<Dialog.Root>
					<Dialog.Trigger class="w-full">
						<Button class="h-12 w-full" variant="outline">
							Import from Spreadsheet
						</Button>
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Import from Spreadsheet</Dialog.Title>
							<Dialog.Description>
								Want to add questions super quickly? Add them in a spreadsheet
								and import them here! To get started, choose a template below.
								Fill out the spreadsheet with your questions & answers and
								download it as a CSV file.
							</Dialog.Description>
						</Dialog.Header>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		</div>

		{#each kit.questions as question}
			<Card.Root class="w-full mt-5 hover:scale-[1.01] transition-transform">
				<Card.Content class="grid grid-cols-12">
					<div class="flex flex-row mt-3 col-span-11">
						<Checkbox
							class="scale-150 hover:scale-[1.8] transition-transform mt-4 mr-5"
						/>
						<h1 class="text-3xl mt-1">{question.text}</h1>
					</div>
					<div class="mt-4 mb-[-30px]">
						<!-- someone is gonna have a heart attack when they see this -30px margin haha im sorry -->
						<div class="p-1">
							<Dialog.Root>
								<Dialog.Trigger class="w-full">
									<button
										class="border-2 rounded-full hover:scale-[1.1] transition-transform p-1 mt-[-4px]"
										><TrashCanOutline width={30} height={30} /></button
									>
								</Dialog.Trigger>
								<Dialog.Content>
									<Dialog.Header>
										<Dialog.Title>Are you sure?</Dialog.Title>
										<Dialog.Description>
											Do you want to delete the question "{question.text}"?
										</Dialog.Description>
									</Dialog.Header>
									<Dialog.Close>
										<div class="grid grid-cols-2 w-48 gap-4">
											<Button class="w-24" variant="outline">Cancel</Button>
											<Button
												class="w-24"
												variant="destructive"
												on:click={() => {
													removeQuestions([question._id]);
												}}>Delete</Button
											>
										</div>
									</Dialog.Close>
								</Dialog.Content>
							</Dialog.Root>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	{/if}
</div>
