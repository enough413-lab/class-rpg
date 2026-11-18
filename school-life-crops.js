import {FLOWER_NAMES} from './school-life-state.js?v=20261118-crops';
// Crop identity and art are independent from server-owned growth and stock rules.
export const CROPS=Object.freeze([
 {kind:0,name:FLOWER_NAMES[0],category:'flower',plantArt:'flower',itemArt:'flower'},
 {kind:1,name:FLOWER_NAMES[1],category:'flower',plantArt:'flowerPink',itemArt:'flowerPink'},
 {kind:2,name:FLOWER_NAMES[2],category:'flower',plantArt:'flowerBlue',itemArt:'flowerBlue'},
 {kind:3,name:'당근',category:'vegetable',plantArt:'carrotPlanted',itemArt:'carrot'},
 {kind:4,name:'무',category:'vegetable',plantArt:'radishPlanted',itemArt:'radish'}
].map(Object.freeze));
export function cropOf(kind){return Number.isInteger(kind)?CROPS[kind]||null:null;}
export function cropPolicy(kind,policies){
 const crop=cropOf(kind),policy=Array.isArray(policies)?policies.find(p=>p?.kind===kind):null;
 if(!crop||!policy||!Number.isInteger(policy.waterDays)||policy.waterDays<1||policy.waterDays>31||!Number.isInteger(policy.harvestItems)||policy.harvestItems<1||policy.harvestItems>999999||!Number.isInteger(policy.harvestSeeds)||policy.harvestSeeds<0||policy.harvestSeeds>999999)return null;
 return Object.freeze({kind,waterDays:policy.waterDays,harvestItems:policy.harvestItems,harvestSeeds:policy.harvestSeeds});
}
