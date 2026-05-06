import type { rolesToCreate } from "./roleData";

export type RoleName = (typeof rolesToCreate)[number]["name"];
