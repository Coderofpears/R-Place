import type StringLights from "svelte-material-icons/StringLights.svelte";

export interface IPathSegment {
	href?: string;
	label: string;
}

export interface INumberOption {
	type: "number";
	id: string;
	label: string;
	default: number;
	min?: number;
	max?: number;
	value?: number;
}

export interface IToggleOption {
	type: "toggle";
	id: string;
	label: string;
	default: boolean;
	value?: boolean;
}

export type IOption = INumberOption | IToggleOption;

export interface IGamemode {
	name: string;
	description: string;
	id: string;
	emoji: string;
	options: IOption[];
}

export interface IKitFolder {
	creator: string;
	isActive: boolean;
	privacy: string;
	title: string;
	__v: number;
	_id: string;
	games: string[];
}

export interface IKit {
	questions: any;
	__v: number;
	_id: string;
	createdAt: string;
	creator: string;
	editCount: number;
	gif: string;
	gradeLevel: string;
	isActive: boolean;
	isArchived: boolean;
	isCopied: boolean;
	lang: string;
	originalSource: string;
	privacy: string;
	source: string;
	subject: string;
	title: string;
	updatedAt: string;
}
