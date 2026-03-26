<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input";
    import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
    import Combobox from "$lib/components/kitComponents/Combobox.svelte"
    
    import * as Select from "$lib/components/ui/select";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as Tabs from "$lib/components/ui/tabs";

    import { getConfig } from "$lib/utils/config";
	import API from "$lib/lkcore/api";

    //get the refetchKits function
    export let refetchKits:() => void

    function swap(json:any){
        var ret:any = {};
        for(var key in json){
            ret[json[key]] = key;
        }
        return ret;
    }

    // create folder function
	async function createFolder(folderName:string) {
		if (folderName != "") {
			const config = getConfig();
			const api = new API(config.apiBase);

			api.post("/api/folders/new", {
				"title": folderName
			}).then(refetchKits);
		}
	}

    // search for kit images function
    async function searchKitImages(query:string) {
        const config = getConfig();
        const api = new API(config.apiBase);

        const response = await api.post("/api/v1/editor/images", {
            searchQuery: query
        }).then((value)=> {
            kitImages = value.photos;
            imageSearchComplete = true;
            console.log("test1")
            console.log(kitImages)
        })

        
    }

    // create kit function
    async function createKit(title:string, subject:string, language:string, image:string) {
        const config = getConfig();
        const api = new API(config.apiBase);

        // find the language code from the name
        let swappedlangs:any = swap(languages)
        language = swappedlangs[language]

        api.post("/api/v1/editor/create", {
            gradeLevel: "Other",
            image: image,
            isPrivate: false,
            language: language,
            subject: subject,
            title: title
        }).then((value)=>{
            window.location = "/kits/edit?id=" + value._id
        });
    }

    function resetInputs() {
        kitName = ""
        kitSubject = ""
        kitLanguage = ""
        createFolderName = ""
        kitImageURLInput = ""

        selectedImageTab = "unsplash"
    }

    // dialog variables
    let createKitDialogOpen:boolean = false;
    let createKitDialog2Open:boolean = false;
    let createFolderDialogOpen:boolean = false;
    let createFolderName:string = ""


    // kit creation consts
    const kitSubjects:string[] = [
		"STEM", 
		"Arts", 
		"Communications", 
		"Computer Science", 
		"Counselor", 
		"Deaf Education", 
		"World Languages", 
		"Speech and Language", 
		"English/Language Arts", 
		"American Sign Language", 
		"Science", 
		"Special Education", 
		"Gifted and Talented", 
		"Technology", 
		"Engineering", 
		"Math", 
		"History and Social Studies", 
		"Health/Physical Education", 
		"English Language Learner (ELL)",
		"Family & Consumer Science (FACS)", 
		"Homeschool", 
		"School Administrator", 
		"Librarian", 
		"Technology/Instructional Coach", 
		"Other"
	].sort()
    const languages = {
        en: "English",
        af: "Afrikaans",
        sq: "Albanian",
        am: "Amharic",
        ar: "Arabic",
        hy: "Armenian",
        az: "Azerbaijani",
        eu: "Basque",
        be: "Belarusian",
        bn: "Bengali",
        bs: "Bosnian",
        bg: "Bulgarian",
        ca: "Catalan",
        ceb: "Cebuano",
        ny: "Chichewa",
        "zh-cn": "Chinese Simplified",
        "zh-tw": "Chinese Traditional",
        co: "Corsican",
        hr: "Croatian",
        cs: "Czech",
        da: "Danish",
        nl: "Dutch",
        eo: "Esperanto",
        et: "Estonian",
        tl: "Filipino",
        fi: "Finnish",
        fr: "French",
        fy: "Frisian",
        gl: "Galician",
        ka: "Georgian",
        de: "German",
        el: "Greek",
        gu: "Gujarati",
        ht: "Haitian Creole",
        ha: "Hausa",
        haw: "Hawaiian",
        iw: "Hebrew",
        hi: "Hindi",
        hmn: "Hmong",
        hu: "Hungarian",
        is: "Icelandic",
        ig: "Igbo",
        id: "Indonesian",
        ga: "Irish",
        it: "Italian",
        ja: "Japanese",
        jw: "Javanese",
        kn: "Kannada",
        kk: "Kazakh",
        km: "Khmer",
        ko: "Korean",
        ku: "Kurdish (Kurmanji)",
        ky: "Kyrgyz",
        lo: "Lao",
        la: "Latin",
        lv: "Latvian",
        lt: "Lithuanian",
        lb: "Luxembourgish",
        mk: "Macedonian",
        mg: "Malagasy",
        ms: "Malay",
        ml: "Malayalam",
        mt: "Maltese",
        mi: "Maori",
        mr: "Marathi",
        mn: "Mongolian",
        my: "Myanmar (Burmese)",
        ne: "Nepali",
        no: "Norwegian",
        ps: "Pashto",
        fa: "Persian",
        pl: "Polish",
        pt: "Portuguese",
        ma: "Punjabi",
        ro: "Romanian",
        ru: "Russian",
        sm: "Samoan",
        gd: "Scots Gaelic",
        sr: "Serbian",
        st: "Sesotho",
        sn: "Shona",
        sd: "Sindhi",
        si: "Sinhala",
        sk: "Slovak",
        sl: "Slovenian",
        so: "Somali",
        es: "Spanish",
        su: "Sundanese",
        sw: "Swahili",
        sv: "Swedish",
        tg: "Tajik",
        ta: "Tamil",
        te: "Telugu",
        th: "Thai",
        tr: "Turkish",
        uk: "Ukrainian",
        ur: "Urdu",
        uz: "Uzbek",
        vi: "Vietnamese",
        cy: "Welsh",
        xh: "Xhosa",
        yi: "Yiddish",
        yo: "Yoruba",
        zu: "Zulu"
    }
    // kit creation variables
    let kitName:string = "";
    let kitSubject:any = "";
    let kitLanguage:string = ""
    $: kitImage = selectedImageTab == "unsplash" ? kitImageUnsplashImageURL : kitImageURLInput

    let kitImages:any;
    let imageSearchComplete:boolean = false;
    let kitImageURLInput:string = ""
    let inputImageValid:boolean = false;
    let kitImageUnsplashImageURL = ""

    let selectedImageTab:string = "unsplash"

    // kit creation part 1 inputs valid
    $: KCp1_valid = (kitName != "") && (kitSubject != "") && (kitLanguage != "")
    // kit creation part 2 inputs valid
    $: KCp2_valid = (selectedImageTab == "link" && inputImageValid) || (selectedImageTab == "unsplash" && kitImageUnsplashImageURL != "")
</script>

<!-- create button + dropdown -->
<DropdownMenu.Root>
    <DropdownMenu.Trigger>
        <Button
            class="h-8 mr-1 transition-transform"
            variant="default"
            on:click={()=>resetInputs()}
        >
            + Create
        </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
        <DropdownMenu.Item on:click={()=>createKitDialogOpen=true}>Create Kit</DropdownMenu.Item>
        <DropdownMenu.Item on:click={()=>createFolderDialogOpen=true}>Create Folder</DropdownMenu.Item>
    </DropdownMenu.Content>
</DropdownMenu.Root>

<!-- create kit dialog 1 -->
<Dialog.Root bind:open={createKitDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title class="mb-2 text-3xl">Create Kit</Dialog.Title>
            <h1>Name</h1>
            <Input placeholder="Kit name" bind:value={kitName} class="w-[280px]"></Input>
            <h1>Subject</h1>
            <Select.Root preventScroll={true} onSelectedChange={(v)=>{kitSubject=v.value;console.log(v.value)}}>
                <Select.Trigger class="w-[280px]">
                    <Select.Value placeholder="Select a Subject" />
                </Select.Trigger>
                <Select.Content>
                    <ScrollArea class="h-48">
                        {#each kitSubjects as subject}
                            <Select.Item value={subject}>{subject}</Select.Item>
                        {/each}
                    </ScrollArea>
                </Select.Content>
            </Select.Root>
            <h1>Language</h1>
            <Combobox
                optionName={"language"}
                options={languages}
                bind:value={kitLanguage}
            >

            </Combobox>
            

        </Dialog.Header>
        <div class="grid grid-cols-2 w-48 gap-4">
            <Button class="w-24" variant="default" on:click={()=>{
                    createKitDialogOpen=false;
                    createKitDialog2Open=true;
                    searchKitImages(kitName);
            }} disabled={!KCp1_valid}>Next</Button>

            <Button
                class="w-24"
                variant="outline"
                on:click={()=>createKitDialogOpen=false}
            >
                Cancel
            </Button>


        </div>
    </Dialog.Content>
</Dialog.Root>
<!-- create kit dialog 2 -->
<Dialog.Root bind:open={createKitDialog2Open}>
    <Dialog.Content>
        <ScrollArea class="h-[400px]">
            <Dialog.Header>
                <Dialog.Title class="mb-2 text-3xl">Choose a cover photo</Dialog.Title>
            </Dialog.Header>
            <Tabs.Root class="w-[400px]" bind:value={selectedImageTab}>
                <Tabs.List class="ml-5">
                    <Tabs.Trigger value="unsplash">Unsplash</Tabs.Trigger>
                    <Tabs.Trigger value="link">Link</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="unsplash">
                    {#if (imageSearchComplete == true)}
                        <div class="grid grid-cols-3 gap-4 ml-5">
                            {#each kitImages as image}
                                <div>
                                    <button on:click={()=> {
                                        kitImageUnsplashImageURL = image.url 
                                    }}>
                                        <img 
                                            class="w-[140px] h-[120px] object-cover rounded-xl {kitImageUnsplashImageURL == image.url ? 'scale-[1.25]' : 'hover:scale-105' } transition-transform" 
                                            src={image.url} 
                                            alt="potential cover for a kit"
                                        >
                                        <a class="text-[0.5rem] ml-0 mt-[-40px]" href="{image.creator.link}">Image by {image.creator.name.length > 16 ? image.creator.name.slice(0, 15) + "..." :  image.creator.name}</a>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </Tabs.Content>
                <Tabs.Content value="link">
                    <Input placeholder="Link to Image" class="mb-2" bind:value={kitImageURLInput} on:change={()=>{
                            var image = new Image();
                            image.src = kitImageURLInput;
                            if (image.width == 0) {
                                inputImageValid = false;
                            } else {
                                inputImageValid = true;
                            }
                        }
                    }></Input>
                    <img src={kitImageURLInput} class="rounded-xl scale-95" alt="">
                </Tabs.Content>
            </Tabs.Root>
        </ScrollArea>
        <div class="grid grid-cols-3 w-[18rem] gap-4">
            <Button class="w-24" variant="default" on:click={()=>{createKitDialog2Open=false;createKitDialogOpen=true}}>Back</Button>
            <Button 
                class="w-24" 
                variant="default"
                disabled={!KCp2_valid} 
                on:click={()=>{
                    createKit(kitName, kitSubject, kitLanguage, kitImage);
                    createKitDialog2Open=false;
                }}
            >
                Create
            </Button>
            
        </div>
    </Dialog.Content>
</Dialog.Root>

<!-- create folder dialog-->
<Dialog.Root bind:open={createFolderDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title class="mb-2">Create Folder</Dialog.Title>
            <Input placeholder="Folder name..." bind:value={createFolderName}></Input>
        </Dialog.Header>
        <Dialog.Close class="w-48">
            <div class="grid grid-cols-2 w-48 gap-4">
                <Button class="w-24" variant="default" on:click={()=>createFolder(createFolderName)}>Create</Button>
                
                <Button
                    class="w-24"
                    variant="outline"
                >
                    Cancel
                </Button>
            </div>
        </Dialog.Close>
    </Dialog.Content>
</Dialog.Root>