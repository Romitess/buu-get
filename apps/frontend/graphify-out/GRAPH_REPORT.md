# Graph Report - frontend  (2026-07-09)

## Corpus Check
- 299 files · ~206,307 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1100 nodes · 1474 edges · 184 communities (163 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6ea776c5`
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

## God Nodes (most connected - your core abstractions)
1. `api` - 24 edges
2. `[]` - 15 edges
3. `useUserStore` - 13 edges
4. `[]` - 11 edges
5. `scripts` - 10 edges
6. `ROLES` - 10 edges
7. `fetchExamById()` - 9 edges
8. `BackendEnrollmentDetail` - 8 edges
9. `BackendSession` - 8 edges
10. `BackendExam` - 8 edges

## Surprising Connections (you probably didn't know these)
- `useExamCertificateDocument()` --calls--> `useUserStore`  [EXTRACTED]
  src/composables/use-exam-certificate-document.ts → src/stores/user.store.ts
- `useExamDocuments()` --calls--> `useUserStore`  [EXTRACTED]
  src/composables/use-exam-documents.ts → src/stores/user.store.ts
- `useAvailableExamRounds()` --calls--> `useExamStore`  [EXTRACTED]
  src/composables/use-available-exam-rounds.ts → src/stores/exam.store.ts
- `useCreateExam()` --calls--> `useExamStore`  [EXTRACTED]
  src/composables/use-create-exam.ts → src/stores/exam.store.ts
- `useCreateExam()` --calls--> `useUserStore`  [EXTRACTED]
  src/composables/use-create-exam.ts → src/stores/user.store.ts

## Import Cycles
- None detected.

## Communities (184 total, 21 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (28): Country, useCountries(), isHovered, leftDrawerOpen, miniState, useNavigation(), useRegisterForm(), ROLE_LABELS (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (35): seatRatio, string, clickCount, props, todoCount, IssuedReceipt, IssuedReceiptBankReconcile, IssuedReceiptTransaction (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (30): { form }, examId, { form }, route, [], nextMaxScore, onScoreKeypress, $q (+22 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (23): $q, router, { t }, useExamDocuments(), props, { t }, props, { t } (+15 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (27): disabledRef, { isRevealed }, props, revealStyle, createBannerSection(), createContentSection(), createRuleSection(), scrollNewBoxIntoView() (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (24): educationOptions, showCalendar, { t }, yesterdayString, emit, nationalIdRules, { t }, currentDate (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (27): { formData, dialog, initFormData, handleTitleTHChange, submitForm, onDialogClose }, isSendingOtp, isVerifyingOtp, showOtpDialog, { validateAndFocusFirstInvalid }, authStore, confirmPassword, email (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (25): colCount, columnTracks, countAislesBeforeColumn(), countAislesBeforeRow(), getColumnAisleStyle(), getRowAisleStyle(), getSeatGridColumn(), getSeatGridRow() (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (18): ariaLabel, { t }, ariaLabel, { t }, ariaLabel, colClass, props, { t } (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (15): attrs, isMuted, isOpen, loadDepartmentOptions(), localFilter, { t }, fetchDailyRevenueSummary(), fetchDepartmentOptions() (+7 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (18): useImageUpload(), UseImageUploadOptions, useImageUrl(), BACKEND_API, IMAGE_CONFIG, ImageCategory, PLATFORM_GATEWAY, cropImageSrc (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (18): clearPaymentImportLocalData(), formatAmount(), formatImportDate(), globalImportedRows, globalSelectedFile, isAutoLoadSuspended, mapBankReconcileToRow(), PaymentImportRow (+10 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (13): BackendSessionLocation, CreateExamPayload, CreatePasscodeItemDto, fetchAllExamsRaw(), fetchExamById(), fetchExamSchedules(), fetchScheduleData(), GroupedSessionTimeRange (+5 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (16): PHYSICAL_STATUS_REMARKS, SeatCell, SeatLabelOrderItem, SeatStatus, SessionLocationOption, SessionSeatItem, SessionSnapshotSeat, StudentSeatInfo (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (24): devDependencies, autoprefixer, @commitlint/cli, @commitlint/config-conventional, eslint, @eslint/js, eslint-plugin-vue, globals (+16 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (15): EligibleCandidate, ExamComparisonSnapshot, ExamRoom, TimeSlot, UseExamFormOptions, createExamPasscodes(), ExamChangeItem, ExamLocationOption (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.16
Nodes (15): fetchExamReportOptions(), ExamAttendanceChartData, ExamBandChangeData, ExamCandidateAttemptStatus, ExamRegistrationTrendChartData, ExamReportFilter, ExamReportOption, ExamReportOptions (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (10): BackendLocationSeat, createLocation(), fetchLocationById(), LocationAislePositionPayload, LocationAislePositionType, LocationPayload, normalizeLocation(), SeatDirectionPayload (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (8): bulkAssignEnrollmentSeats(), BulkSeatAssignment, fetchEnrollmentsByExamId(), PaginatedEnrollmentResponse, RequestFixPayload, EnrollmentTableRow, PAYMENT_STATUS_LABELS, VERIFY_STATUS_LABELS

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (13): onRequest, { t }, EXAM_STATUS_LABELS, EXAM_TYPE_LABELS, PaginationModel, PaymentRow, Role, SearchRow (+5 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (13): BackendExamCandidateInfo, BackendExamInformationRound, BackendExamReportSummary, BackendRateStat, BackendScoreStat, BackendStat, cleanParams(), fetchExamReportSummary() (+5 more)

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (12): createEnrollment(), deleteExam(), fetchUserEnrollments(), formatTime(), invalidateExamCache(), updateEnrollmentStatus(), ReceiptInformation, ExamCalendarAvailability (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (12): AvailableExamRound, MAX_DISPLAY_ROUNDS, useAvailableExamRounds(), ApiErrorData, ExamPasscodeDialogExpose, RegistrationStatus, ROUTE_NAMES, useExamSchedule() (+4 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (9): EnrollmentWithSeatOrder, SeatCandidateRow, SeatCandidateSessionLocation, SessionLocationOption, EnrollmentSeatAssignment, SeatSessionLocation, fetchRawEnrollmentsByExamId(), BackendEnrollmentDetail (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.15
Nodes (10): DEFAULT_EXAM_INFO, EMPTY_DETAILS, ENROLLMENT_STATUS, formatFee(), formatLocationWithRoom(), NOTIFY_MSG, ReceiptStatus, TRANSACTION_MATCH_STATUS (+2 more)

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
Cohesion: 0.21
Nodes (6): api, ComponentCustomProperties, RegisterPayload, RegisterResponse, fetchLatestProfileHistoryImages(), ProfileEditHistory

### Community 32 - "Community 32"
Cohesion: 0.26
Nodes (7): ExecutiveTestTakerQuery, fetchExecutiveTestTakers(), EnrollmentStatus, ExamHistoryRow, ExecutiveExamHistoryResponse, ExecutiveTestTakerPage, ExecutiveTestTakerRow

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (5): { formatThaiDate }, getProgressColor(), getRatio(), $q, { t }

### Community 34 - "Community 34"
Cohesion: 0.17
Nodes (9): BackendTransactionRef, BackendTransactionRefEnrollment, BackendTransactionRefExam, BackendTransactionRefProfile, BackendTransactionRefSession, BackendTransactionRefTransaction, BackendTransactionRefUser, TransactionRefSearchParams (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.17
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
Cohesion: 0.28
Nodes (6): findFocusableElement(), FOCUSABLE_SELECTOR, FocusFirstInvalidFieldOptions, getFormElement(), isHTMLElement(), UseFocusFirstInvalidFieldReturn

### Community 41 - "Community 41"
Cohesion: 0.25
Nodes (4): handleViewDetail, onRequest, { t }, ExamInformationRoundRow

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (4): examDateLabel, getLocationAisleAfter, printAisleAfterCols, printLocation

### Community 43 - "Community 43"
Cohesion: 0.38
Nodes (5): isUnresolvableBackendHost(), resolveApiBaseUrl(), UNRESOLVABLE_BACKEND_HOSTS, __dirname, monorepoRootEnv

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (6): formattedAmount, fullNameRules, identityPlaceholder, identityRules, phoneRules, requiredRules

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (3): BackendVoucher, BulkIssueVouchersPayload, SendVoucherEmailPayload

### Community 47 - "Community 47"
Cohesion: 0.47
Nodes (4): numberToThaiText(), readThaiNumber(), THAI_DIGITS, THAI_PLACES

### Community 48 - "Community 48"
Cohesion: 0.40
Nodes (4): THAI_SHORT_MONTHS, useThaiDate(), formatBackendDate(), parseBangkokDate()

### Community 49 - "Community 49"
Cohesion: 0.40
Nodes (4): donutColorName, sparklineOptions, sparklineSeries, trendArrow

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (3): AVAILABLE_ICONS, isMenuOpen, searchQuery

### Community 51 - "Community 51"
Cohesion: 0.40
Nodes (4): endOfLine, printWidth, $schema, singleQuote

### Community 57 - "Community 57"
Cohesion: 0.67
Nodes (4): buddhistToGregorian(), createExamRound(), groupTimeRangesByTime(), updateExamRound()

## Knowledge Gaps
- **417 isolated node(s):** `$schema`, `singleQuote`, `printWidth`, `endOfLine`, `UNRESOLVABLE_BACKEND_HOSTS` (+412 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `api` connect `Community 31` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 17`, `Community 18`, `Community 20`, `Community 30`, `Community 32`, `Community 34`, `Community 35`, `Community 45`, `Community 46`, `Community 52`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `[]` connect `Community 2` to `Community 3`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `ROLES` connect `Community 0` to `Community 33`, `Community 15`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `singleQuote`, `printWidth` to the rest of the system?**
  _417 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06531204644412192 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05272895467160037 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05656565656565657 - nodes in this community are weakly interconnected._