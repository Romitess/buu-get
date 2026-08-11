# Graph Report - frontend  (2026-08-11)

## Corpus Check
- 365 files · ~247,311 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1460 nodes · 2116 edges · 221 communities (199 shown, 22 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `123a087f`
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
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 125|Community 125]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 137|Community 137]]
- [[_COMMUNITY_Community 140|Community 140]]
- [[_COMMUNITY_Community 145|Community 145]]
- [[_COMMUNITY_Community 164|Community 164]]
- [[_COMMUNITY_Community 165|Community 165]]
- [[_COMMUNITY_Community 172|Community 172]]
- [[_COMMUNITY_Community 184|Community 184]]
- [[_COMMUNITY_Community 185|Community 185]]
- [[_COMMUNITY_Community 186|Community 186]]
- [[_COMMUNITY_Community 187|Community 187]]
- [[_COMMUNITY_Community 188|Community 188]]
- [[_COMMUNITY_Community 193|Community 193]]
- [[_COMMUNITY_Community 194|Community 194]]
- [[_COMMUNITY_Community 199|Community 199]]
- [[_COMMUNITY_Community 200|Community 200]]
- [[_COMMUNITY_Community 201|Community 201]]
- [[_COMMUNITY_Community 202|Community 202]]
- [[_COMMUNITY_Community 203|Community 203]]
- [[_COMMUNITY_Community 204|Community 204]]
- [[_COMMUNITY_Community 210|Community 210]]
- [[_COMMUNITY_Community 211|Community 211]]
- [[_COMMUNITY_Community 212|Community 212]]
- [[_COMMUNITY_Community 213|Community 213]]
- [[_COMMUNITY_Community 214|Community 214]]
- [[_COMMUNITY_Community 217|Community 217]]
- [[_COMMUNITY_Community 221|Community 221]]

## God Nodes (most connected - your core abstractions)
1. `api` - 27 edges
2. `useUserStore` - 16 edges
3. `[]` - 15 edges
4. `ROLES` - 11 edges
5. `[]` - 11 edges
6. `scripts` - 10 edges
7. `ENROLLMENT_STATUS` - 10 edges
8. `fetchExamById()` - 10 edges
9. `BackendEnrollmentDetail` - 10 edges
10. `ExamHistoryItem` - 10 edges

## Surprising Connections (you probably didn't know these)
- `generateCertificateQrDataUrl()` --calls--> `getPublicAppUrl()`  [EXTRACTED]
  src/utils/verify-qr.ts → config/resolve-app-public-url.ts
- `generateReceiptQrDataUrl()` --calls--> `getPublicAppUrl()`  [EXTRACTED]
  src/utils/verify-qr.ts → config/resolve-app-public-url.ts
- `getVerifyLandingUrl()` --calls--> `getPublicAppUrl()`  [EXTRACTED]
  src/utils/verify-qr.ts → config/resolve-app-public-url.ts
- `generateCertificateQrDataUrl()` --calls--> `buildCertificateVerifyUrl()`  [EXTRACTED]
  src/utils/verify-qr.ts → config/resolve-app-public-url.ts
- `generateReceiptQrDataUrl()` --calls--> `buildReceiptVerifyUrl()`  [EXTRACTED]
  src/utils/verify-qr.ts → config/resolve-app-public-url.ts

## Import Cycles
- None detected.

## Communities (221 total, 22 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (20): buildCertificateScoreLines(), buildScoreDraftFromScore(), ScoreDraft, sumLineScores(), BackendExamScore, ExamScoreLinePayload, fetchExamScores(), FetchExamScoresParams (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (18): AdmissionVoucherData, BackendEnrollment, BackendPasscode, BackendScore, CustomStatus, DialogCancelProps, DialogConfirmProps, ExamClockProps (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.20
Nodes (7): examId, { form }, route, breadcrumbs, removeUnresolvedQueryParams(), resolveBreadcrumbPath(), route

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (6): props, { t }, colOptions, isOpen, props, rowOptions

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (30): disabledRef, { isRevealed }, props, revealStyle, createBannerSection(), createContentSection(), createRuleSection(), scrollNewBoxIntoView() (+22 more)

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
Nodes (13): attrs, isMuted, isOpen, popupContentClass, localFilter, { t }, fetchDailyRevenueSummary(), CreateFundSourcePayload (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.26
Nodes (11): ComponentCustomProperties, UseImageUploadOptions, BACKEND_API, IMAGE_CONFIG, ImageCategory, PLATFORM_GATEWAY, uploadImage(), validateImageFile() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (20): clearPaymentImportLocalData(), formatAmount(), formatImportDate(), globalImportedRows, globalSelectedFile, isAutoLoadSuspended, mapBankReconcileToRow(), PaymentImportRow (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (25): formatLocationWithRoom(), BackendSessionLocation, buddhistDateAndTimeToIso(), buddhistToGregorian(), buddhistToGregorianPeriodEnd(), createEnrollment(), CreateExamPayload, createExamRound() (+17 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (15): APPLICANT_TYPE_REMARKS, PHYSICAL_STATUS_REMARKS, SeatLabelOrderItem, SeatStatus, SessionLocationOption, SessionSeatItem, SessionSnapshotSeat, StudentSeatInfo (+7 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (26): devDependencies, autoprefixer, @commitlint/cli, @commitlint/config-conventional, eslint, @eslint/js, eslint-plugin-vue, globals (+18 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (9): useNavigation(), currentYear, menuLinks, { t }, { userStore, leftDrawerOpen, miniState, isHovered, isMini }, $q, route, { showAdminDrawer } (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (29): BackendExamCandidateInfo, BackendExamInformationRound, BackendExamReportSummary, BackendRateStat, BackendScoreStat, BackendStat, cleanParams(), fetchExamReportOptions() (+21 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (10): BackendLocationSeat, createLocation(), fetchLocationById(), LocationAislePositionPayload, LocationAislePositionType, LocationPayload, normalizeLocation(), SeatDirectionPayload (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (32): EnrollmentWithSeatOrder, SeatCandidateRow, SeatCandidateSessionLocation, SessionLocationOption, TestHarness, useExamSeatCandidates(), EnrollmentSeatAssignment, SeatSessionLocation (+24 more)

### Community 19 - "Community 19"
Cohesion: 0.20
Nodes (9): EXAM_STATUS_LABELS, EXAM_TYPE_LABELS, PaymentRow, Role, SearchRow, TABLE_ACTIONS, TableAction, ToolButtonConfig (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (25): DashboardViewType, EXAM_SIMULATION_TOUR_STEPS, getCourseCardStepIndex(), getQuizSectionStepIndex(), getRestartStepIndex(), getStepIndex(), TourPlacement, TourResumeTrigger (+17 more)

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (9): ExamRound, ExamRegistrationExpiryInput, getExamRoundsCalendarAvailability(), isExamRoundRegistrationExpired(), parseExamStartDateTime(), parseRegistrationDate(), parseRegistrationEndDate(), parseSlashDate() (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (16): CANDIDATE_HOME_EXAM_HISTORY_PATH, collapseActivitiesByExam(), deriveCandidateHomeActivities(), EXAM_HISTORY_PATH, EXAM_SCHEDULE_PATH, getExamDateMs(), getExamStartMs(), hasVoucher() (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.19
Nodes (10): formatFee(), fetchAllExamsRaw(), fetchExamSchedules(), fetchScheduleData(), isRequestCanceled(), { apiGet }, retryAsync(), { apiGet } (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (10): DEFAULT_EXAM_INFO, EMPTY_DETAILS, ENROLLMENT_STATUS, normalizeExamPasscode(), NOTIFY_MSG, VALIDATION_MSG, VERIFY_STATUS, getActiveEnrollmentCount() (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (12): author, description, engines, node, npm, lint-staged, src/**/*.{ts,vue}, name (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (17): dependencies, apexcharts, axios, dotenv, html2canvas, html5-qrcode, jsbarcode, jspdf (+9 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (7): activeTimeSessions, currentSessionCapacity, examDateLabel, selectedSession, selectedSessionLocation, selectedSessionTime, sessionLocationLabelList

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (11): examRound, examYear, isLoading, pageSubtitle, pageTitle, $q, route, router (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (10): examYear, isLoading, pageSubtitle, pageTitle, $q, route, router, searchQuery (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (4): AttendanceTableRow, codeToScanChar(), KEDMANEE_TO_QWERTY, normalizeScanPayload()

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (5): api, RegisterPayload, RegisterResponse, CreateVoidedReceiptPayload, VoidedReceiptResponse

### Community 32 - "Community 32"
Cohesion: 0.23
Nodes (8): ExecutiveTestTakerQuery, fetchExecutiveTestTakers(), EnrollmentStatus, ExamHistoryRow, ExecutiveExamHistoryResponse, ExecutiveExamScoreLine, ExecutiveTestTakerPage, ExecutiveTestTakerRow

### Community 33 - "Community 33"
Cohesion: 0.16
Nodes (7): THAI_SHORT_MONTHS, useThaiDate(), { formatThaiDate }, getProgressColor(), getRatio(), $q, { t }

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (10): BackendTransactionRef, BackendTransactionRefEnrollment, BackendTransactionRefExam, BackendTransactionRefProfile, BackendTransactionRefReceipt, BackendTransactionRefSession, BackendTransactionRefTransaction, BackendTransactionRefUser (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.10
Nodes (18): AvailableExamRound, MAX_DISPLAY_ROUNDS, useAvailableExamRounds(), fetchUserEnrollments(), BackendTransaction, confirmPaymentFlow(), ConfirmPaymentFlowPayload, CreatePendingPaymentPayload (+10 more)

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
Cohesion: 0.22
Nodes (6): DefineDateTimeFormat, DefineLocaleMessage, DefineNumberFormat, i18n, MessageLanguages, MessageSchema

### Community 40 - "Community 40"
Cohesion: 0.24
Nodes (8): findFocusableElement(), FOCUSABLE_SELECTOR, FocusFirstInvalidFieldOptions, getFormElement(), isHTMLElement(), isScrollableOverflow(), scrollElementIntoNearestContainers(), UseFocusFirstInvalidFieldReturn

### Community 41 - "Community 41"
Cohesion: 0.12
Nodes (9): scoreLineHeaders, { t }, handleViewDetail, onRequest, { t }, get(), has(), ExamInformationRoundRow (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (4): examDateLabel, getLocationAisleAfter, printAisleAfterCols, printLocation

### Community 43 - "Community 43"
Cohesion: 0.31
Nodes (7): getMonorepoEnvFilePaths(), loadMonorepoEnv(), MONOREPO_ENV_FILES, MONOREPO_ROOT, isUnresolvableBackendHost(), resolveApiBaseUrl(), UNRESOLVABLE_BACKEND_HOSTS

### Community 44 - "Community 44"
Cohesion: 0.25
Nodes (6): formattedAmount, fullNameRules, identityPlaceholder, identityRules, phoneRules, requiredRules

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (4): BackendVoucher, BulkIssueVouchersPayload, BulkIssueVouchersResult, SendVoucherEmailPayload

### Community 46 - "Community 46"
Cohesion: 0.20
Nodes (6): { form }, CreateExamForm, emit, {
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
  isEligibleCandidatesLocked,
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
  removeTimeSlot,
  addRoom,
  removeRoom,
  importCandidates,
  addEligibleCandidatesFromUsers,
  removeEligibleCandidates,
  generatePasscodes,
  applySharedPasscode,
  exportCandidates,
  handleCancel,
  handleSave,
  sortTimeSlots,
  dateErrors,
  clearFieldError,
}, onCancel(), onSave()

### Community 47 - "Community 47"
Cohesion: 0.47
Nodes (4): numberToThaiText(), readThaiNumber(), THAI_DIGITS, THAI_PLACES

### Community 48 - "Community 48"
Cohesion: 0.17
Nodes (10): fullEnrollment, notify, slimEnrollment, TestHarness, useExamCertificateDocument(), useExamDocuments(), fetchEnrollmentById(), ExamHistoryItem (+2 more)

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
Cohesion: 0.28
Nodes (7): ROLE_LABELS, ROLES, RolesType, RouteMeta, routes, DefaultRouteLocation, getDefaultRouteForRole()

### Community 57 - "Community 57"
Cohesion: 0.10
Nodes (19): countAvailableSeats(), ExamComparisonSnapshot, ExamRoom, resolveLoadedRoomSeats(), TimeSlot, UseExamFormOptions, createExamPasscodes(), ExamChangeItem (+11 more)

### Community 62 - "Community 62"
Cohesion: 0.18
Nodes (12): buildAssistJoinUrl(), closeAssistSession(), createAssistSession(), CreateAssistSessionPayload, listAssistEvents(), AssistCandidateSummary, AssistEvent, AssistSessionMeta (+4 more)

### Community 77 - "Community 77"
Cohesion: 0.07
Nodes (26): displayValidFromDate, displayValidUntilDate, isEditingBandRules, isSavingBandRules, isSubmitting, issueDate, onScoreKeypress, previewBandLevel (+18 more)

### Community 83 - "Community 83"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, ProcessEnv

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (5): computedSessionName, isLoading, isLoadingHistory, pagination, showCertDialog

### Community 120 - "Community 120"
Cohesion: 0.19
Nodes (11): [], nextMaxScore, onScoreKeypress, $q, removeBand, router, { t }, BandRuleData (+3 more)

### Community 125 - "Community 125"
Cohesion: 0.12
Nodes (12): SeatCell, COLOR_BY_CODE, COLOR_BY_REMARK, getPhysicalStatusBgColor(), PHYSICAL_STATUS_BG_COLORS, cardStyle, displayRemark, hasSeat (+4 more)

### Community 129 - "Community 129"
Cohesion: 0.12
Nodes (8): BackendUserResponse, checkUserIdentifiers(), getUsersFromApi(), LoginResponse, PaginatedUsersResult, SearchUsersParams, UserIdentifierCheckResult, User

### Community 137 - "Community 137"
Cohesion: 0.16
Nodes (14): ReceiptStatus, TRANSACTION_PAYMENT_STATUS, ExamHistoryCategory, StatusBadgeView, buildBadge(), buildBaseItem(), CancellationReason, EnrollmentCancelProbe (+6 more)

### Community 140 - "Community 140"
Cohesion: 0.21
Nodes (7): { dialogRef, onDialogHide, onDialogOK, onDialogCancel }, isConfirming, isEditingRegulations, props, i18n, voucherData, VoucherData

### Community 145 - "Community 145"
Cohesion: 0.18
Nodes (9): activeRegulationsEn, activeRegulationsTh, editingRegulationsEn, editingRegulationsTh, isEditingRegulations, isSavingRegulations, loadedRegulationsEn, loadedRegulationsTh (+1 more)

### Community 164 - "Community 164"
Cohesion: 0.20
Nodes (8): useImageUpload(), useImageUrl(), cropImageSrc, { isUploading, handleImageUpload }, $q, showCropDialog, { t }, getImageUrl()

### Community 165 - "Community 165"
Cohesion: 0.47
Nodes (8): buildCertificateVerifyUrl(), buildReceiptVerifyUrl(), buildVerifyLandingUrl(), getPublicAppUrl(), generateCertificateQrDataUrl(), generateQrDataUrl(), generateReceiptQrDataUrl(), getVerifyLandingUrl()

### Community 172 - "Community 172"
Cohesion: 0.32
Nodes (6): $q, router, { t }, getRegulations(), RegulationsData, saveRegulations()

### Community 184 - "Community 184"
Cohesion: 0.15
Nodes (6): EligibleCandidate, errorMessage, passcode, debouncedFetchResults, PasscodeType, PaginationModel

### Community 185 - "Community 185"
Cohesion: 0.43
Nodes (5): createEmptyRow(), createSkeletonRows(), PLACEHOLDER_ROW_KEYS, PlaceholderRow, resolveTableRowKey()

### Community 186 - "Community 186"
Cohesion: 0.32
Nodes (6): isHovered, leftDrawerOpen, miniState, NavigationGroup, NavigationItem, UserRole

### Community 187 - "Community 187"
Cohesion: 0.21
Nodes (11): useCandidateHomeActivities(), useCreateExam(), ApiErrorData, ExamPasscodeDialogExpose, RegistrationStatus, ROUTE_NAMES, useExamSchedule(), getCurrentThaiFiscalYearAd() (+3 more)

### Community 188 - "Community 188"
Cohesion: 0.39
Nodes (5): buildSheetAoA(), downloadMultiSheetXlsx(), groupRowsByKey(), sanitizeExcelSheetName(), SheetExportGroup

### Community 193 - "Community 193"
Cohesion: 0.33
Nodes (4): currentStep, examTitle, onUpdateModelValue, transitionName

### Community 194 - "Community 194"
Cohesion: 0.29
Nodes (3): seatRatio, string, Exam

### Community 199 - "Community 199"
Cohesion: 0.23
Nodes (9): clickCount, props, todoCount, AppCalendarProps, ExamCalendarProps, Meta, PasscodeLog, Todo (+1 more)

### Community 200 - "Community 200"
Cohesion: 0.27
Nodes (9): verifyCertificate(), verifyDocument(), verifyReceipt(), CertificateVerifyStatus, ReceiptVerifyStatus, VerifyCertificateResponse, VerifyDocumentResponse, VerifyDocumentType (+1 more)

### Community 201 - "Community 201"
Cohesion: 0.33
Nodes (4): IssuedReceipt, IssuedReceiptBankReconcile, IssuedReceiptTransaction, ExamEnrollment

### Community 202 - "Community 202"
Cohesion: 0.22
Nodes (6): BackendExamCertificate, BulkIssueCertificateCandidate, bulkIssueCertificates(), BulkIssueCertificatesPayload, BulkIssueCertificatesResult, CreateExamCertificatePayload

### Community 203 - "Community 203"
Cohesion: 0.60
Nodes (4): clearSvg(), normalizeBarcodePayload(), PLACEHOLDER_VALUES, renderVoucherBarcode()

### Community 204 - "Community 204"
Cohesion: 0.47
Nodes (4): baseExam(), cancelledTimeoutItem(), seatAssignedItem(), TRANSACTION_MATCH_STATUS

### Community 210 - "Community 210"
Cohesion: 0.33
Nodes (5): CertificateBandRule, CertificateCardData, CertificateData, CertificateScoreLine, CertificateScoreReportData

### Community 214 - "Community 214"
Cohesion: 0.50
Nodes (3): appPublicUrl, buuInfo, UniversityInfo

### Community 221 - "Community 221"
Cohesion: 0.67
Nodes (3): getLocalDateYmd(), isFutureLocalDate(), issueDateOptions()

## Knowledge Gaps
- **533 isolated node(s):** `$schema`, `singleQuote`, `printWidth`, `endOfLine`, `MONOREPO_ENV_FILES` (+528 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `api` connect `Community 31` to `Community 0`, `Community 129`, `Community 4`, `Community 6`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 16`, `Community 17`, `Community 18`, `Community 32`, `Community 34`, `Community 35`, `Community 172`, `Community 45`, `Community 62`, `Community 200`, `Community 201`, `Community 202`, `Community 211`, `Community 120`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `ROLES` connect `Community 52` to `Community 33`, `Community 129`, `Community 15`, `Community 22`, `Community 57`, `Community 186`, `Community 187`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `getImageUrl()` connect `Community 164` to `Community 48`, `Community 10`, `Community 77`, `Community 13`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `$schema`, `singleQuote`, `printWidth` to the rest of the system?**
  _533 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0746031746031746 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.07922705314009662 - nodes in this community are weakly interconnected._