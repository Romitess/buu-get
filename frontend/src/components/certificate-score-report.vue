<template>
  <div class="certificate-score-report">
    <section class="score-card">
      <header class="report-header row items-center no-wrap">
        <div class="col-auto">
          <img src="icons/logo-vocher.png" class="header-logo" alt="BUULI Logo" />
        </div>
        <div class="col text-center">
          <h1 class="header-title">BUU-GET: Burapha University's Graduate English Test</h1>
          <h2 class="header-subtitle">Test Taker Score Report</h2>
        </div>
      </header>

      <main class="report-body relative-position">
        <div class="watermark-bg no-pointer-events">GET</div>
        <div class="row items-stretch content-container">
          <div class="profile-column column items-center justify-center">
            <div class="profile-photo-wrapper">
              <img
                v-if="data.profileImage"
                :src="data.profileImage"
                class="profile-photo-img"
                alt="Profile"
              />
              <q-icon v-else name="image" size="48px" class="profile-photo-placeholder-icon" />
            </div>
            <div class="photo-name text-weight-bold q-mt-sm">{{ data.fullName }}</div>
          </div>

          <div class="detail-column">
            <div class="row details-row">
              <div class="col-6 detail-group">
                <div class="info-group">
                  <span class="info-label">Test Taker ID:</span>
                  <span class="info-value">{{ data.testTakerId }}</span>
                </div>
                <div class="info-group">
                  <span class="info-label">Citizen ID:</span>
                  <span class="info-value">{{ data.nationalId }}</span>
                </div>
              </div>
              <div class="col-6 detail-group">
                <div class="info-group">
                  <span class="info-label">Test Session:</span>
                  <span class="info-value">{{ data.testSession }}</span>
                </div>
                <div class="info-group">
                  <span class="info-label">Test Date:</span>
                  <span class="info-value">{{ data.testDate }}</span>
                </div>
              </div>
            </div>

            <div class="score-section">
              <div class="score-header">Score</div>
              <div class="score-row">
                <span>1. Vocabulary &amp; Grammar</span>
                <span>{{ data.vocabScore }}/50</span>
              </div>
              <div class="score-row">
                <span>2. Reading</span>
                <span>{{ data.readingScore }}/50</span>
              </div>
              <div class="score-row text-weight-bold">
                <span>Overall BUU-GET Score</span>
                <span>{{ data.totalScore }}/100</span>
              </div>
              <div class="score-separator"></div>
              <div class="score-level-row">
                <span>Level</span>
                <span>Band</span>
                <span class="text-weight-bold">{{ data.band }}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer class="report-footer row justify-between items-center no-wrap">
        <div class="row metadata-group">
          <div>
            <div class="metadata-label">Report Issue Date:</div>
            <div class="metadata-value">{{ data.reportIssueDate }}</div>
          </div>
          <div>
            <div class="metadata-label">Score Valid Until:</div>
            <div class="metadata-value">{{ data.scoreValidUntil }}</div>
          </div>
        </div>
        <q-icon name="qr_code_2" size="44px" color="dark" />
      </footer>
    </section>

    <section class="band-card relative-position">
      <div class="watermark-bg watermark-bg--band no-pointer-events">GET</div>
      <h3 class="band-title">BUU GET Band Description</h3>
      <table class="band-table">
        <thead>
          <tr>
            <th class="text-center">Band</th>
            <th class="text-center">Score</th>
            <th class="text-center">CEFR</th>
            <th class="text-center">Performance Descriptor</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in data.bandRules" :key="rule.id">
            <td class="text-center">{{ rule.band }}</td>
            <td class="text-center">{{ rule.minScore }}-{{ rule.maxScore }}</td>
            <td class="text-center">{{ rule.cefr }}</td>
            <td>{{ rule.descriptor }}</td>
          </tr>
        </tbody>
      </table>
      <p class="band-note">
        The performance descriptor is taken from CEFR Overall Reading Comprehension Scale
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CertificateScoreReportData } from 'src/types/certificate';

defineProps<{
  data: CertificateScoreReportData;
}>();
</script>

<style scoped lang="scss">
.certificate-score-report {
  width: 210mm;
  height: 297mm;
  padding: 13mm 17mm 11mm;
  background: #ffffff;
  box-sizing: border-box;
  font-family: var(--font-family-base);
  color: #111827;
}

.score-card,
.band-card {
  background: linear-gradient(to bottom, #fbfcfd, #f2f6fa);
  border: 1px solid #111827;
  border-radius: 7px;
  overflow: hidden;
}

.score-card {
  height: 106mm;
}

.report-header {
  height: 19mm;
  padding: 6px 12px;
  border-bottom: 1px solid #cbd5e1;
}

.header-logo {
  width: 72px;
  object-fit: contain;
}

.header-title {
  margin: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: #0d47a1;
  line-height: 1.2;
}

.header-subtitle {
  margin: 2px 0 0;
  font-size: 11.5px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.2;
}

.report-body {
  height: 69mm;
  padding: 8mm 11mm 6mm;
}

.content-container {
  position: relative;
  z-index: 1;
  height: 100%;
  max-width: 150mm;
  margin: 0 auto;
}

.watermark-bg {
  position: absolute;
  top: 50%;
  left: 56%;
  transform: translate(-50%, -50%);
  font-size: 106px;
  font-weight: 800;
  line-height: 1;
  color: rgba(30, 137, 229, 0.06);
  pointer-events: none;
  user-select: none;
}

.profile-column {
  width: 48mm;
  flex: 0 0 48mm;
}

.detail-column {
  width: 90mm;
  flex: 0 0 90mm;
  padding-left: 8mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.profile-photo-wrapper {
  width: 44.5mm;
  height: 52.4mm;
  aspect-ratio: 168 / 198;
  overflow: hidden;
  background: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transform: rotate(0deg);
}

.profile-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.profile-photo-placeholder-icon {
  color: #111827;
}

.photo-name {
  width: 48mm;
  text-align: center;
  font-size: 9px;
  color: #0d47a1;
  line-height: 1.2;
}

.details-row {
  margin-bottom: 3mm;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 2.8mm;
}

.info-group {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 8.5px;
  font-weight: 600;
  color: #111827;
}

.info-value {
  font-size: 9.5px;
  font-weight: 700;
  color: #0d47a1;
  line-height: 1.25;
}

.score-section {
  width: 88mm;
  font-size: 9px;
}

.score-header {
  display: inline-block;
  font-weight: 600;
  text-decoration: underline;
  margin-bottom: 1.4mm;
}

.score-row,
.score-level-row {
  display: flex;
  justify-content: space-between;
  line-height: 1.35;
}

.score-separator {
  height: 1px;
  background: #111827;
  margin: 1.4mm 0 1mm;
}

.report-footer {
  height: 18mm;
  padding: 4px 9mm;
  border-top: 1px solid #cbd5e1;
}

.metadata-group {
  gap: 14mm;
  padding-left: 1mm;
}

.metadata-label {
  font-size: 8.5px;
  font-weight: 600;
}

.metadata-value {
  margin-top: 1mm;
  font-size: 9px;
  font-weight: 700;
  color: #0d47a1;
}

.band-card {
  position: relative;
  margin-top: 3mm;
  height: 122mm;
  padding: 6mm 3mm 3mm;
  overflow: hidden;
}

.watermark-bg--band {
  left: 50%;
  top: 50%;
}

.band-title {
  position: relative;
  z-index: 1;
  margin: 0 0 5mm;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
}

.band-table {
  position: relative;
  z-index: 1;
  width: 100%;
  border-collapse: collapse;
  width: calc(100% - 4mm);
  margin: 0 auto;
  font-size: 8.2px;
  line-height: 1.2;

  th,
  td {
    padding: 1.55mm 1.35mm;
    border-bottom: 0.6px solid #94a3b8;
    vertical-align: top;
  }

  thead th {
    border-bottom: 1px solid #111827;
    font-weight: 700;
  }

  tbody tr:last-child td {
    border-bottom: 1px solid #111827;
  }
}

.band-note {
  position: relative;
  z-index: 1;
  width: calc(100% - 4mm);
  margin: 2.2mm auto 0;
  font-size: 8px;
  font-style: italic;
}
</style>
