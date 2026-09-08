import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import {
  getRoomStation,
  listMyCheckInRooms,
  openRoomStation,
} from 'src/services/check-in-assist.service';
import type { MyCheckInRoom } from 'src/types/check-in-assist.types';
import { useUserStore } from 'src/stores/user.store';
import { ROLES, type RoleValue } from 'src/constants/roles';
import { ceToBeString } from 'src/utils/thai-date';
import {
  buildExamRoomDisplay,
  normalizeExamRoomNo,
  type ExamRoomDisplay,
} from 'src/utils/check-in-room-label';

const DATE_PICKER_ROLES: RoleValue[] = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.STAFF,
  ROLES.REGISTRATION_OFFICER,
  ROLES.EXAM_OPERATIONS_OFFICER,
];

const bangkokToday = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

export function useCheckInRooms() {
  const { t } = useI18n();
  const $q = useQuasar();
  const router = useRouter();
  const userStore = useUserStore();

  const rooms = ref<MyCheckInRoom[]>([]);
  const isLoading = ref(false);
  const searchQuery = ref('');
  const selectedDate = ref(bangkokToday());
  const pendingRoom = ref<MyCheckInRoom | null>(null);
  const isConfirmOpen = ref(false);
  const isOpening = ref(false);

  const canPickDate = computed(() =>
    userStore.effectiveRoles.some((role) => DATE_PICKER_ROLES.includes(role)),
  );

  const selectedDateDisplay = computed(() => ceToBeString(selectedDate.value));

  const filteredRooms = computed((): MyCheckInRoom[] => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return rooms.value;
    return rooms.value.filter((room) => {
      const haystack = [
        room.examName,
        room.locationName,
        room.roomNo ?? '',
        ...(room.proctorNames ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  });

  const loadRooms = async (): Promise<void> => {
    isLoading.value = true;
    try {
      const date = canPickDate.value ? selectedDate.value : undefined;
      rooms.value = await listMyCheckInRooms(date);
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: t('admin.checkIn.errors.loadRoomsFailed'),
        position: 'top',
      });
      rooms.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  watch(selectedDate, () => {
    if (!canPickDate.value) return;
    void loadRooms();
  });

  const formatRoomLabel = (room: MyCheckInRoom): string => {
    const parts = [room.locationName];
    const roomNo = normalizeExamRoomNo(room.roomNo);
    if (roomNo) {
      parts.push(t('admin.checkIn.rooms.roomNo', { room: roomNo }));
    }
    if (room.floorNo != null) {
      parts.push(t('admin.checkIn.rooms.floor', { floor: room.floorNo }));
    }
    return parts.join(' · ');
  };

  const formatRoomHero = (room: MyCheckInRoom): ExamRoomDisplay =>
    buildExamRoomDisplay(
      room,
      (roomNo) => t('admin.checkIn.rooms.roomNo', { room: roomNo }),
      (floor) => t('admin.checkIn.rooms.floor', { floor }),
    );

  const formatSessionTime = (room: MyCheckInRoom): string => {
    const start = room.sessionStart?.slice(0, 5);
    const end = room.sessionEnd?.slice(0, 5);
    if (start && end) return `${start}–${end}`;
    return start ?? end ?? '-';
  };

  const requestOpenRoom = (room: MyCheckInRoom): void => {
    pendingRoom.value = room;
    isConfirmOpen.value = true;
  };

  const cancelConfirm = (): void => {
    isConfirmOpen.value = false;
    pendingRoom.value = null;
  };

  const confirmOpenRoom = async (): Promise<void> => {
    const room = pendingRoom.value;
    if (!room || isOpening.value) return;
    isOpening.value = true;
    try {
      const station =
        room.activeStationCasId != null
          ? await getRoomStation(room.activeStationCasId).catch(() => openRoomStation(room.slId))
          : await openRoomStation(room.slId);
      isConfirmOpen.value = false;
      pendingRoom.value = null;
      await router.push({
        name: 'admin-room-check-in-scanner',
        params: { casId: String(station.casId) },
      });
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: t('admin.checkIn.errors.openStationFailed'),
        position: 'top',
      });
    } finally {
      isOpening.value = false;
    }
  };

  return {
    rooms,
    filteredRooms,
    isLoading,
    searchQuery,
    selectedDate,
    selectedDateDisplay,
    canPickDate,
    pendingRoom,
    isConfirmOpen,
    isOpening,
    loadRooms,
    formatRoomLabel,
    formatRoomHero,
    formatSessionTime,
    requestOpenRoom,
    cancelConfirm,
    confirmOpenRoom,
  };
}
