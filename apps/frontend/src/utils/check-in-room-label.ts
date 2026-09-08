export type ExamRoomParts = {
  locationName: string;
  roomNo?: string | null;
  floorNo?: number | null;
};

export type ExamRoomDisplay = {
  title: string;
  subtitle: string;
};

/** Strip a duplicated room prefix already stored in LOCATION_ROOM_NO. */
export const normalizeExamRoomNo = (roomNo?: string | null): string => {
  if (!roomNo) return '';
  return roomNo.replace(/^(ห้อง|room)\s*/i, '').trim();
};

/** Room-first label for confirm/scan; building and floor stay secondary. */
export const buildExamRoomDisplay = (
  room: ExamRoomParts,
  formatRoom: (roomNo: string) => string,
  formatFloor: (floor: number) => string,
): ExamRoomDisplay => {
  const roomNo = normalizeExamRoomNo(room.roomNo);
  const floorLabel = room.floorNo != null ? formatFloor(room.floorNo) : '';
  if (roomNo) {
    return {
      title: formatRoom(roomNo),
      subtitle: [room.locationName, floorLabel].filter(Boolean).join(' · '),
    };
  }
  return {
    title: room.locationName,
    subtitle: floorLabel,
  };
};
