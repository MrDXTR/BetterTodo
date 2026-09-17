/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agent from "../agent.js";
import type * as attachments from "../attachments.js";
import type * as auth from "../auth.js";
import type * as automations from "../automations.js";
import type * as boards from "../boards.js";
import type * as cards from "../cards.js";
import type * as chat from "../chat.js";
import type * as checklists from "../checklists.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as customFields from "../customFields.js";
import type * as dashboard from "../dashboard.js";
import type * as emails from "../emails.js";
import type * as files from "../files.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as importExport from "../importExport.js";
import type * as labels from "../labels.js";
import type * as lib_boardTransfer from "../lib/boardTransfer.js";
import type * as lists from "../lists.js";
import type * as notifications from "../notifications.js";
import type * as permissions from "../permissions.js";
import type * as privateData from "../privateData.js";
import type * as search from "../search.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  attachments: typeof attachments;
  auth: typeof auth;
  automations: typeof automations;
  boards: typeof boards;
  cards: typeof cards;
  chat: typeof chat;
  checklists: typeof checklists;
  comments: typeof comments;
  crons: typeof crons;
  customFields: typeof customFields;
  dashboard: typeof dashboard;
  emails: typeof emails;
  files: typeof files;
  healthCheck: typeof healthCheck;
  http: typeof http;
  importExport: typeof importExport;
  labels: typeof labels;
  "lib/boardTransfer": typeof lib_boardTransfer;
  lists: typeof lists;
  notifications: typeof notifications;
  permissions: typeof permissions;
  privateData: typeof privateData;
  search: typeof search;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
};
