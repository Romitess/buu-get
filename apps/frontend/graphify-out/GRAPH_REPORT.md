# Graph Report - frontend  (2026-07-23)

## Corpus Check
- 319 files · ~221,404 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1196 nodes · 1657 edges · 193 communities (174 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `99746434`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 137|Community 137]]
- [[_COMMUNITY_Community 140|Community 140]]
- [[_COMMUNITY_Community 164|Community 164]]
- [[_COMMUNITY_Community 165|Community 165]]
- [[_COMMUNITY_Community 172|Community 172]]
- [[_COMMUNITY_Community 184|Community 184]]
- [[_COMMUNITY_Community 185|Community 185]]
- [[_COMMUNITY_Community 186|Community 186]]
- [[_COMMUNITY_Community 187|Community 187]]
- [[_COMMUNITY_Community 188|Community 188]]

## God Nodes (most connected - your core abstractions)
1. `api` - 25 edges
2. `[]` - 15 edges
3. `useUserStore` - 15 edges
4. `ROLES` - 11 edges
5. `[]` - 11 edges
6. `scripts` - 10 edges
7. `fetchExamById()` - 9 edges
8. `useExamStore` - 9 edges
9. `BackendEnrollmentDetail` - 9 edges
10. `BackendSession` - 9 edges

## Surprising Connections (you probably didn't know these)
- `getInitialStepIndex()` --calls--> `getCourseCardStepIndex()`  [EXTRACTED]
  src/composables/use-exam-simulation-tour.ts → src/composables/exam-simulation-tour-steps.ts
- `useAvailableExamRounds()` --calls--> `useExamStore`  [EXTRACTED]
  src/composables/use-available-exam-rounds.ts → src/stores/exam.store.ts
- `useCandidateHomeActivities()` --calls--> `useUserStore`  [EXTRACTED]
  src/composables/use-candidate-home-activities.ts → src/stores/user.store.ts
- `useCreateExam()` --calls--> `useExamStore`  [EXTRACTED]
  src/composables/use-create-exam.ts → src/stores/exam.store.ts
- `useCreateExam()` --calls--> `useUserStore`  [EXTRACTED]
  src/composables/use-create-exam.ts → src/stores/user.store.ts

## Import Cycles
- None detected.

## Communities (193 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (12): isHovered, leftDrawerOpen, miniState, ROLE_LABELS, ROLES, RolesType, RouteMeta, NavigationGroup (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (22): IssuedReceipt, IssuedReceiptBankReconcile, IssuedReceiptTransaction, BackendUser, AdmissionVoucherData, BackendEnrollment, BackendPasscode, BackendScore (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (10): { form }, examId, { form }, route, CreateExamForm, useCreateExam(), emit, {
  examTypeOptions,
  examFormatOptions,
  proctorOptions,
  locationOptions,
  fundSourceOptions,
  getOccupiedLocationIdsForSlot,
  isLoadingData,
  isSaving,
  isImportingCandidates,
  isEditMode,
  isPublishedSectionLocked,
  isScheduleLocked,
  isLockedByEnrollment,
  isSpecialRound,
  wasOriginallyPublished,
  activeSlotIndex,
  candidateSearch,
  filteredCandidates,
  existingCandidateKeys,
  hasEligibleCandidates,
  fieldErrors,
  shakeKey,
  loadInitialData,
  addTimeSlot,
  removeTimeSlot,
  addRoom,
  removeRoom,
  importCandidates,
  addEligibleCandidatesFromUsers,
  removeEligibleCandidates,
  generatePasscodes,
  exportCandidates,
  handleCancel,
  handleSave,
  sortTimeSlots,
  dateErrors,
  clearFieldError,
} (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (5): props, { t }, props, { t }, isOpen

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (27): disabledRef, { isRevealed }, props, revealStyle, createBannerSection(), createContentSection(), createRuleSection(), scrollNewBoxIntoView() (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (24): educationOptions, showCalendar, { t }, yesterdayString, emit, nationalIdRules, { t }, currentDate (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (25): authStore, confirmPassword, email, { focusFirstInvalidField }, i18n, isSendingOtp, isVerifyingOtp, password (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (25): colCount, columnTracks, countAislesBeforeColumn(), countAislesBeforeRow(), getColumnAisleStyle(), getRowAisleStyle(), getSeatGridColumn(), getSeatGridRow() (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (11): ariaLabel, { t }, ariaLabel, { t }, columnClass, ariaLabel, narrowColumns, props (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (12): attrs, isMuted, isOpen, localFilter, { t }, fetchDailyRevenueSummary(), CreateFundSourcePayload, fetchFundSources() (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.30
Nodes (10): UseImageUploadOptions, BACKEND_API, IMAGE_CONFIG, ImageCategory, PLATFORM_GATEWAY, uploadImage(), validateImageFile(), ImageAsset (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (20): clearPaymentImportLocalData(), formatAmount(), formatImportDate(), globalImportedRows, globalSelectedFile, isAutoLoadSuspended, mapBankReconcileToRow(), PaymentImportRow (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (21): BackendSessionLocation, buddhistToGregorian(), buddhistToGregorianPeriodEnd(), createEnrollment(), CreateExamPayload, createExamRound(), CreatePasscodeItemDto, deleteExam() (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (18): SeatCandidateSessionLocation, PHYSICAL_STATUS_REMARKS, SeatCell, SeatLabelOrderItem, SeatSessionLocation, SeatStatus, SessionLocationOption, SessionSeatItem (+10 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (24): devDependencies, autoprefixer, @commitlint/cli, @commitlint/config-conventional, eslint, @eslint/js, eslint-plugin-vue, globals (+16 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (19): ExamComparisonSnapshot, ExamRoom, TimeSlot, UseExamFormOptions, NOTIFY_MSG, VALIDATION_MSG, createExamPasscodes(), ExamChangeItem (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (28): BackendExamCandidateInfo, BackendExamInformationRound, BackendExamReportSummary, BackendRateStat, BackendScoreStat, BackendStat, cleanParams(), fetchExamReportOptions() (+20 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (10): BackendLocationSeat, createLocation(), fetchLocationById(), LocationAislePositionPayload, LocationAislePositionType, LocationPayload, normalizeLocation(), SeatDirectionPayload (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (9): bulkAssignEnrollmentSeats(), BulkSeatAssignment, fetchEnrollmentsByExamId(), PaginatedEnrollmentResponse, RawEnrollmentFetchParams, RequestFixPayload, EnrollmentTableRow, PAYMENT_STATUS_LABELS (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (12): AvailableExamRound, MAX_DISPLAY_ROUNDS, EXAM_STATUS_LABELS, EXAM_TYPE_LABELS, ExamSchedule, PaymentRow, Role, SearchRow (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (25): DashboardViewType, EXAM_SIMULATION_TOUR_STEPS, getCourseCardStepIndex(), getQuizSectionStepIndex(), getRestartStepIndex(), getStepIndex(), TourPlacement, TourResumeTrigger (+17 more)

### Community 21 - "Community 21"
Cohesion: 0.43
Nodes (7): ExamCalendarAvailability, getExamRoundsCalendarAvailability(), isExamRoundRegistrationExpired(), parseRegistrationDate(), parseRegistrationEndDate(), parseSlashDate(), toLocalEndOfDay()

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (18): useAvailableExamRounds(), CandidateActivityKind, CandidateHomeActivity, EXAM_HISTORY_PATH, EXAM_SCHEDULE_PATH, getExamDateMs(), getPaymentDeadlineMs(), hasVoucher() (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (13): EnrollmentWithSeatOrder, SeatCandidateRow, SessionLocationOption, TestHarness, useExamSeatCandidates(), EnrollmentSeatAssignment, fetchRawEnrollmentsByExamId(), fetchExamById() (+5 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (17): ApiErrorData, ExamPasscodeDialogExpose, RegistrationStatus, ROUTE_NAMES, DEFAULT_EXAM_INFO, EMPTY_DETAILS, ENROLLMENT_STATUS, formatFee() (+9 more)

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (12): author, description, engines, node, npm, lint-staged, src/**/*.{ts,vue}, name (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (13): dependencies, apexcharts, axios, dotenv, html2canvas, jspdf, pinia, quasar (+5 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (11): activeLocation, activeSessionLocation, activeTimeSessions, currentRoomAttendances, examDateLabel, localSessionAttendedCount, roomOptions, selectedSession (+3 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (11): examRound, examYear, isLoading, pageSubtitle, pageTitle, $q, route, router (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (10): examYear, isLoading, pageSubtitle, pageTitle, $q, route, router, searchQuery (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.24
Nodes (8): createExamAttendance(), CreateExamAttendancePayload, AttendanceTableRow, BackendAttendance, BackendSessionDetail, BackendUserProfile, ExamAttendStatus, VerifyStatus

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (8): api, ComponentCustomProperties, RegisterPayload, RegisterResponse, BackendExamCertificate, CreateExamCertificatePayload, CreateVoidedReceiptPayload, VoidedReceiptResponse

### Community 32 - "Community 32"
Cohesion: 0.27
Nodes (6): ExecutiveTestTakerQuery, fetchExecutiveTestTakers(), ExamHistoryRow, ExecutiveExamHistoryResponse, ExecutiveTestTakerPage, ExecutiveTestTakerRow

### Community 33 - "Community 33"
Cohesion: 0.16
Nodes (7): THAI_SHORT_MONTHS, useThaiDate(), { formatThaiDate }, getProgressColor(), getRatio(), $q, { t }

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (10): BackendTransactionRef, BackendTransactionRefEnrollment, BackendTransactionRefExam, BackendTransactionRefProfile, BackendTransactionRefReceipt, BackendTransactionRefSession, BackendTransactionRefTransaction, BackendTransactionRefUser (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.15
Nodes (9): BackendTransaction, confirmPaymentFlow(), ConfirmPaymentFlowPayload, CreatePendingPaymentPayload, createTransaction(), CreateTransactionFlowPayload, CreateTransactionFlowResponse, expireTransaction() (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (10): [], activeTimeSessions, currentRoomEnrollments, examDateLabel, localSessionPaidCount, localSessionTotalCount, selectedSession, selectedSessionCapacity (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.27
Nodes (8): closeCreateDialog(), fetchData(), filteredFundSources, fundSourcesWithComputedData, openCreateDialog(), resetCreateForm(), saveButtonLabel, validateCreateForm()

### Community 38 - "Community 38"
Cohesion: 0.20
Nodes (10): scripts, build, dev, format, lint, postinstall, test, test:e2e (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.25
Nodes (5): DefineDateTimeFormat, DefineLocaleMessage, DefineNumberFormat, MessageLanguages, MessageSchema

### Community 40 - "Community 40"
Cohesion: 0.24
Nodes (8): findFocusableElement(), FOCUSABLE_SELECTOR, FocusFirstInvalidFieldOptions, getFormElement(), isHTMLElement(), isScrollableOverflow(), scrollElementIntoNearestContainers(), UseFocusFirstInvalidFieldReturn

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (7): onRequest, { t }, handleViewDetail, onRequest, { t }, ExamInformationRoundRow, PaginationModel

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (4): examDateLabel, getLocationAisleAfter, printAisleAfterCols, printLocation

### Community 43 - "Community 43"
Cohesion: 0.29
Nodes (7): getMonorepoEnvFilePaths(), loadMonorepoEnv(), MONOREPO_ENV_FILES, MONOREPO_ROOT, isUnresolvableBackendHost(), resolveApiBaseUrl(), UNRESOLVABLE_BACKEND_HOSTS

### Community 44 - "Community 44"
Cohesion: 0.25
Nodes (6): formattedAmount, fullNameRules, identityPlaceholder, identityRules, phoneRules, requiredRules

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (4): BackendVoucher, BulkIssueVouchersPayload, BulkIssueVouchersResult, SendVoucherEmailPayload

### Community 46 - "Community 46"
Cohesion: 0.29
Nodes (5): BackendExamScore, fetchExamScores(), PaginatedExamScores, SaveExamScorePayload, unwrapExamScoresPage()

### Community 47 - "Community 47"
Cohesion: 0.47
Nodes (4): numberToThaiText(), readThaiNumber(), THAI_DIGITS, THAI_PLACES

### Community 48 - "Community 48"
Cohesion: 0.16
Nodes (12): useExamCertificateDocument(), useExamDocuments(), routes, fetchEnrollmentById(), useUserStore, CertificateBandRule, CertificateCardData, CertificateData (+4 more)

### Community 49 - "Community 49"
Cohesion: 0.40
Nodes (4): donutColorName, sparklineOptions, sparklineSeries, trendArrow

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (3): AVAILABLE_ICONS, isMenuOpen, searchQuery

### Community 51 - "Community 51"
Cohesion: 0.40
Nodes (4): endOfLine, printWidth, $schema, singleQuote

### Community 52 - "Community 52"
Cohesion: 0.12
Nodes (8): BackendUserResponse, checkUserIdentifiers(), getUsersFromApi(), LoginResponse, PaginatedUsersResult, SearchUsersParams, UserIdentifierCheckResult, User

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (5): EligibleCandidate, get(), has(), PasscodeType, TableRequestProps

### Community 57 - "Community 57"
Cohesion: 0.19
Nodes (11): [], nextMaxScore, onScoreKeypress, $q, removeBand, router, { t }, BandRuleData (+3 more)

### Community 137 - "Community 137"
Cohesion: 0.23
Nodes (9): clickCount, props, todoCount, AppCalendarProps, ExamCalendarProps, Meta, PasscodeLog, Todo (+1 more)

### Community 140 - "Community 140"
Cohesion: 0.22
Nodes (7): props, { dialogRef, onDialogHide, onDialogOK, onDialogCancel }, isConfirming, props, i18n, voucherData, VoucherData

### Community 164 - "Community 164"
Cohesion: 0.20
Nodes (8): useImageUpload(), useImageUrl(), cropImageSrc, { isUploading, handleImageUpload }, $q, showCropDialog, { t }, getImageUrl()

### Community 165 - "Community 165"
Cohesion: 0.18
Nodes (7): useNavigation(), currentYear, menuLinks, { t }, { userStore, leftDrawerOpen, miniState, isHovered, isMini }, route, { showAdminDrawer }

### Community 172 - "Community 172"
Cohesion: 0.28
Nodes (6): $q, router, { t }, getRegulations(), RegulationsData, saveRegulations()

### Community 184 - "Community 184"
Cohesion: 0.29
Nodes (3): seatRatio, string, Exam

### Community 185 - "Community 185"
Cohesion: 0.43
Nodes (5): createEmptyRow(), createSkeletonRows(), PLACEHOLDER_ROW_KEYS, PlaceholderRow, resolveTableRowKey()

### Community 186 - "Community 186"
Cohesion: 0.33
Nodes (4): colOptions, isOpen, props, rowOptions

### Community 187 - "Community 187"
Cohesion: 0.40
Nodes (4): breadcrumbs, removeUnresolvedQueryParams(), resolveBreadcrumbPath(), route

## Knowledge Gaps
- **435 isolated node(s):** `$schema`, `singleQuote`, `printWidth`, `endOfLine`, `MONOREPO_ENV_FILES` (+430 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `api` connect `Community 31` to `Community 1`, `Community 4`, `Community 6`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 16`, `Community 17`, `Community 18`, `Community 30`, `Community 32`, `Community 34`, `Community 35`, `Community 172`, `Community 45`, `Community 46`, `Community 52`, `Community 57`, `Community 188`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `ROLES` connect `Community 0` to `Community 33`, `Community 165`, `Community 15`, `Community 48`, `Community 52`, `Community 22`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `[]` connect `Community 57` to `Community 2`, `Community 3`, `Community 187`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `$schema`, `singleQuote`, `printWidth` to the rest of the system?**
  _435 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08615384615384615 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._