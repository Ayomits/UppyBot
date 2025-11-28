import { Discord } from "discordx";
import { singleton } from "tsyringe";

@Discord()
@singleton()
export class LogginController {}
