import {ALL_SKILLS,type SkillId} from './skill-directory.js';
export const PRACTICE_COOLDOWN_TICKS=100;
export const PRACTICE_XP=1;
export const PRACTICE_RADIUS=3;
export const PRACTICE_METHODS={
  "attack": {
    "skill": "attack",
    "station": "dummy",
    "description": "Aim controlled strikes at the straw dummy"
  },
  "strength": {
    "skill": "strength",
    "station": "dummy",
    "description": "Push the weighted training post"
  },
  "defence": {
    "skill": "defence",
    "station": "dummy",
    "description": "Rehearse a shield block against the padded post"
  },
  "ranged": {
    "skill": "ranged",
    "station": "dummy",
    "description": "Aim tethered practice arrows at the straw target"
  },
  "magic": {
    "skill": "magic",
    "station": "altar",
    "description": "Trace a harmless light rune"
  },
  "hitpoints": {
    "skill": "hitpoints",
    "station": "course",
    "description": "Perform a gentle conditioning drill"
  },
  "prayer": {
    "skill": "prayer",
    "station": "altar",
    "description": "Reflect quietly at the practice shrine"
  },
  "woodcutting": {
    "skill": "woodcutting",
    "station": "bench",
    "description": "Rehearse axe strokes on a reusable practice log"
  },
  "mining": {
    "skill": "mining",
    "station": "bench",
    "description": "Tap the reusable training stone"
  },
  "fishing": {
    "skill": "fishing",
    "station": "pond",
    "description": "Rehearse casting with a hookless practice rod"
  },
  "agility": {
    "skill": "agility",
    "station": "course",
    "description": "Rehearse a balance-step drill"
  },
  "cooking": {
    "skill": "cooking",
    "station": "bench",
    "description": "Rehearse stirring an empty training pot"
  },
  "crafting": {
    "skill": "crafting",
    "station": "bench",
    "description": "Shape reusable practice clay"
  },
  "firemaking": {
    "skill": "firemaking",
    "station": "bench",
    "description": "Rehearse tinder preparation without lighting a fire"
  },
  "fletching": {
    "skill": "fletching",
    "station": "bench",
    "description": "Fit reusable blunt arrow parts"
  },
  "herblore": {
    "skill": "herblore",
    "station": "bench",
    "description": "Sort labelled inert herb samples"
  },
  "runecrafting": {
    "skill": "runecrafting",
    "station": "altar",
    "description": "Trace a practice rune on an inert tablet"
  },
  "slayer": {
    "skill": "slayer",
    "station": "dummy",
    "description": "Study a reusable creature-tracking card"
  },
  "smithing": {
    "skill": "smithing",
    "station": "bench",
    "description": "Tap a cold practice billet with a wooden mallet"
  },
  "thieving": {
    "skill": "thieving",
    "station": "bench",
    "description": "Rehearse opening an unlocked practice box"
  },
  "farming": {
    "skill": "farming",
    "station": "garden",
    "description": "Tend the demonstration planter"
  },
  "construction": {
    "skill": "construction",
    "station": "bench",
    "description": "Fit reusable wooden joints"
  },
  "hunter": {
    "skill": "hunter",
    "station": "garden",
    "description": "Rehearse a harmless empty trap frame"
  }
} as const;
export function isPracticeSkill(x:unknown):x is SkillId{return typeof x==='string'&&(ALL_SKILLS as readonly string[]).includes(x);}
export function checkedPracticeTick(x:unknown,max=Number.MAX_SAFE_INTEGER):number{if(typeof x!=='number'||!Number.isSafeInteger(x)||x<0||x>max)throw Error('Invalid practice clock');return x;}
