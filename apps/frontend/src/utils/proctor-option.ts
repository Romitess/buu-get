import type { MsgPerson } from 'src/types/msg-person';

export type ProctorOption = {
  label: string;
  value: string;
  psnId?: string;
  caption?: string;
};

type PersonNameFields = {
  PSN_ID?: string;
  PRF_NAMETH?: string | null;
  PSN_FNAMETH?: string | null;
  PSN_FNAMEEN?: string | null;
  PSN_LNAMETH?: string | null;
  PSN_LNAMEEN?: string | null;
  PSN_EMAIL_BUU?: string | null;
};

export const formatMsgPersonName = (person: PersonNameFields): string => {
  const prefix = person.PRF_NAMETH?.trim() || '';
  const first = person.PSN_FNAMETH?.trim() || person.PSN_FNAMEEN?.trim() || '';
  const last = person.PSN_LNAMETH?.trim() || person.PSN_LNAMEEN?.trim() || '';
  return [prefix, first, last].filter(Boolean).join(' ').trim() || person.PSN_ID || '';
};

export const toProctorOption = (person: MsgPerson | PersonNameFields): ProctorOption => {
  const psnId = person.PSN_ID ?? '';
  const label = formatMsgPersonName(person) || psnId;
  const email = person.PSN_EMAIL_BUU?.trim();
  return {
    label,
    value: psnId,
    psnId,
    caption: email || psnId,
  };
};

export const mergeProctorOptions = (
  current: ProctorOption[],
  incoming: ProctorOption[],
): ProctorOption[] => {
  const byValue = new Map(current.map((option) => [option.value, option]));
  for (const option of incoming) {
    if (!option.value) continue;
    byValue.set(option.value, option);
  }
  return [...byValue.values()];
};

export const resolveProctorSavePayload = (
  selectedValues: string[],
  options: ProctorOption[],
): { labels: string[]; psnIds: string[] } => {
  const optionByValue = new Map(options.map((option) => [option.value, option]));
  const labels = selectedValues.map((value) => optionByValue.get(value)?.label ?? value);
  const psnIds = [
    ...new Set(
      selectedValues
        .map((value) => optionByValue.get(value)?.psnId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  return { labels, psnIds };
};
