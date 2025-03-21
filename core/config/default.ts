import {
  ContextProviderWithParams,
  ModelDescription,
  SerializedContinueConfig,
  SlashCommandDescription,
} from "../";

export const FREE_TRIAL_MODELS: ModelDescription[] = [
  {
    title: "兴业小助手-深度求索V2",
    provider: "ollama",
    model: "deepseek-v2:16b",
    apiBase: "http://20.5.198.227:11434",
    contextLength: 10240,
    completionOptions: {
      temperature: 0,
      maxTokens: 2000
    },
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
  {
    title: "兴业小助手-千问",
    provider: "ollama",
    model: "codeqwen:7b",
    apiBase: "http://20.5.211.161:11434",
    contextLength: 10240,
    completionOptions: {
      temperature: 0,
      maxTokens: 2000
    },
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
  {
    title: "兴业小助手-深度求索",
    provider: "ollama",
    model: "deepseek-coder:6.7b",
    apiBase: "http://20.5.211.161:11434",
    contextLength: 10240,
    completionOptions: {
      temperature: 0,
      maxTokens: 2000
    },
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
];

export const defaultContextProvidersVsCode: ContextProviderWithParams[] = [
  { name: "code", params: {} },
  { name: "docs", params: {} },
  { name: "diff", params: {} },
  { name: "terminal", params: {} },
  { name: "problems", params: {} },
  { name: "folder", params: {} },
  { name: "codebase", params: {} },
];

export const defaultContextProvidersJetBrains: ContextProviderWithParams[] = [
  { name: "diff", params: {} },
  { name: "folder", params: {} },
  { name: "codebase", params: {} },
];

export const defaultSlashCommandsVscode: SlashCommandDescription[] = [
  {
    name: "share",
    description: "Export the current chat session to markdown",
  },
  {
    name: "cmd",
    description: "Generate a shell command",
  },
  {
    name: "commit",
    description: "Generate a git commit message",
  },
];

export const defaultSlashCommandsJetBrains = [
  {
    name: "share",
    description: "Export the current chat session to markdown",
  },
  {
    name: "commit",
    description: "Generate a git commit message",
  },
];

export const defaultConfig: SerializedContinueConfig = {
  models: FREE_TRIAL_MODELS,
  tabAutocompleteModel: {
    title: "兴业小助手-深度求索V2",
    provider: "ollama",
    model: "deepseek-v2:16b",
    apiBase: "http://20.5.198.227:11434",
  },
  embeddingsProvider: {
    provider: "ollama",
    model: "nomic-embed-text:latest",
    apiBase: "http://20.5.211.161:11434",
  },
  contextProviders: defaultContextProvidersVsCode,
  slashCommands: defaultSlashCommandsVscode,
  data: [],
  disableIndexing: true,
};

export const defaultConfigJetBrains: SerializedContinueConfig = {
  models: FREE_TRIAL_MODELS,
  tabAutocompleteModel: {
    title: "兴业小助手-深度求索V2",
    provider: "ollama",
    model: "deepseek-v2:16b",
    apiBase: "http://20.5.198.227:11434",
  },
  embeddingsProvider: {
    provider: "ollama",
    model: "nomic-embed-text:latest",
    apiBase: "http://20.5.211.161:11434",
  },
  contextProviders: defaultContextProvidersJetBrains,
  slashCommands: defaultSlashCommandsJetBrains,
  data: [],
  disableIndexing: true,
};
