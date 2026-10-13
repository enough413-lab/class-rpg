export const weekdays = ['월요일','화요일','수요일','목요일','금요일','토요일','일요일'];
export function resetDay(value) {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 7 ? day : 1;
}
export function weeklyResetLabel(quest) {
  return quest.quest_type === 'weekly' ? '매주 ' + weekdays[resetDay(quest.weekly_reset_day)-1] + ' 0시 갱신 (한국시간)' : '';
}
export function resetDayOptions(value = 1) {
  return weekdays.map((label, index) => '<option value="' + (index+1) + '"' + (index+1 === resetDay(value) ? ' selected' : '') + '>' + label + '</option>').join('');
}
export function questPeriod(type, weekday = 1, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(now).map(part => [part.type,part.value]));
  const date = new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day)));
  if (type === 'weekly') date.setUTCDate(date.getUTCDate() - ((date.getUTCDay()+6)%7 + 1 - resetDay(weekday) + 7)%7);
  return type === 'main' ? 'once' : date.toISOString().slice(0,10);
}

export function nextResetLabel(quest){if(!quest.next_reset_at||!['daily','weekly'].includes(quest.quest_type))return '';const value=new Date(quest.next_reset_at);if(!Number.isFinite(value.getTime()))return '';return '다음 도전: '+new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(value)+' (한국시간)';}
