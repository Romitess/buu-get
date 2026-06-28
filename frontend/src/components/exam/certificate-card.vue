<template>
  <div class="certificate-card-preview relative-position">
    <template v-if="side === 'front'">
      <div class="cert-header row items-center no-wrap">
        <div class="col-auto">
          <img src="icons/logo-vocher.png" class="cert-logo" alt="BUULI Logo" />
        </div>
        <div class="col text-center cert-title-container">
          <div class="cert-main-title text-weight-bold">
            BUU-GET: Burapha University's Graduate English Test
          </div>
          <div class="cert-sub-title text-weight-medium">Test Taker Score Report</div>
        </div>
      </div>

      <div class="cert-body flex-1 column justify-between">
        <div class="watermark-bg no-pointer-events">GET</div>

        <div class="row q-col-gutter-md items-stretch content-container">
          <div class="col-12 col-sm-4 flex flex-center column">
            <div class="profile-photo-wrapper shadow-1">
              <img v-if="photoUrl" :src="photoUrl" class="profile-photo-img" alt="Profile" />
              <q-icon v-else name="image" size="48px" class="profile-photo-placeholder-icon" />
            </div>
            <div class="photo-name text-weight-bold q-mt-sm">{{ fullname }}</div>
          </div>

          <div class="col-12 col-sm-8 detail-grid-column">
            <div class="row q-col-gutter-y-sm full-height items-center">
              <div class="col-12 col-sm-6 detail-group">
                <div class="info-group">
                  <span class="info-label">Test Taker ID:</span>
                  <span class="info-value">{{ testTakerId }}</span>
                </div>
                <div class="info-group">
                  <span class="info-label">Citizen ID:</span>
                  <span class="info-value">{{ nationalId }}</span>
                </div>
              </div>

              <div class="col-12 col-sm-6 detail-group">
                <div class="info-group">
                  <span class="info-label">Test Session:</span>
                  <span class="info-value">{{ testSession }}</span>
                </div>
                <div class="info-group">
                  <span class="info-label">Test Date:</span>
                  <span class="info-value">{{ testDate }}</span>
                </div>
              </div>

              <div class="col-12 q-mt-md">
                <div class="score-section">
                  <div class="score-header q-mb-xs">Score</div>
                  <div class="row justify-between items-center q-py-xs score-row">
                    <div class="score-label">1. Vocabulary &amp; Grammar</div>
                    <div class="score-val">{{ vocabScore }}</div>
                  </div>
                  <div class="row justify-between items-center q-py-xs score-row">
                    <div class="score-label">2. Reading</div>
                    <div class="score-val">{{ readingScore }}</div>
                  </div>
                  <div class="row justify-between items-center q-py-xs score-row text-weight-bold">
                    <div class="text-dark">Overall BUU-GET Score</div>
                    <div class="text-dark">{{ totalScore }}</div>
                  </div>
                  <q-separator class="score-separator q-my-xs" />
                  <div class="row items-center q-py-xs score-row-level text-dark">
                    <div class="col text-left">Level</div>
                    <div class="col text-center">Band</div>
                    <div class="col text-right text-weight-bold">{{ bandLevel }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="cert-footer row justify-between items-center no-wrap">
        <div class="col row q-col-gutter-x-xl metadata-group">
          <div class="col-auto text-left">
            <div class="metadata-label">Report Issue Date:</div>
            <div class="metadata-value">{{ issueDate }}</div>
          </div>
          <div class="col-auto text-left">
            <div class="metadata-label">Score Valid Until:</div>
            <div class="metadata-value">{{ validUntil }}</div>
          </div>
        </div>
        <div class="col-auto text-right">
          <q-icon name="qr_code_2" size="40px" color="dark" class="qr-code-icon" />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="cert-back-container column justify-between">
        <div class="watermark-bg no-pointer-events">GET</div>
        <div class="cert-back-content">
          <div class="text-subtitle1 text-weight-bold text-dark text-center q-mb-md">
            BUU GET Band Description
          </div>
          <div class="band-table-container">
            <table class="band-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 10%">Band</th>
                  <th class="text-center" style="width: 15%">Score</th>
                  <th class="text-center" style="width: 12%">CEFR</th>
                  <th class="text-left">Performance Descriptor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rule in bandRules" :key="rule.id">
                  <td class="text-center text-weight-bold">{{ rule.band }}</td>
                  <td class="text-center">{{ rule.minScore }}-{{ rule.maxScore }}</td>
                  <td class="text-center">{{ rule.cefr }}</td>
                  <td class="text-left descriptor-cell">{{ rule.descriptor }}</td>
                </tr>
                <tr v-if="!bandRules.length">
                  <td colspan="4" class="text-center text-grey-6 py-md">
                    No band descriptions defined
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p class="band-table-note text-left italic">
          The performance descriptor is taken from CEFR Overall Reading Comprehension Scale
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CertificateBandRule } from 'src/types/certificate';

interface Props {
  side: 'front' | 'back';
  fullname: string;
  testTakerId: string;
  nationalId: string;
  testSession: string;
  testDate: string;
  vocabScore: string;
  readingScore: string;
  totalScore: string;
  bandLevel: string;
  issueDate: string;
  validUntil: string;
  bandRules: CertificateBandRule[];
  photoUrl?: string | null;
}

withDefaults(defineProps<Props>(), {
  photoUrl: null,
});
</script>

<style scoped lang="scss">
.certificate-card-preview {
  width: 100%;
  height: 375px;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  background-color: #f8f9fa;
  overflow: hidden;
  position: relative;
  font-family: 'Sarabun', 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.cert-header {
  height: 60px;
  padding: 12px 20px;
  background-color: #f8f9fa;
  border-bottom: 1.5px solid #cbd5e1;
  box-sizing: border-box;
}

.cert-logo {
  height: 36px;
  object-fit: contain;
}

.cert-main-title {
  font-size: 13px;
  line-height: 1.2;
  color: #104a8e;
}

.cert-sub-title {
  font-size: 11px;
  line-height: 1.2;
  color: #707070;
}

.cert-body {
  position: relative;
  padding: 16px 20px;
  background: #f8f9fa;
}

.watermark-bg {
  position: absolute;
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  font-family: 'Sarabun', 'Inter', sans-serif;
  font-weight: 800;
  font-size: 120px;
  line-height: 100%;
  color: rgba(16, 74, 142, 0.04);
  z-index: 0;
  user-select: none;
  pointer-events: none;
}

.content-container {
  position: relative;
  z-index: 1;
}

.profile-photo-wrapper {
  width: 120px;
  height: 144px;
  background-color: #00000033 !important;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1.5px solid #00000033 !important;
}

.profile-photo-placeholder-icon {
  color: #000000 !important;
}

.profile-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-name {
  font-size: 11px;
  line-height: 1.3;
  text-align: center;
  max-width: 120px;
  word-break: break-word;
  color: #104a8e;
}

.detail-grid-column {
  padding-left: 12px !important;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-group {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 11px;
  color: #000000;
  font-weight: 600;
  margin-bottom: 2px;
  line-height: 1.2;
}

.info-value {
  font-size: 14px;
  font-weight: 700;
  color: #104a8e;
  line-height: 1.3;
}

.score-section {
  width: 100%;
}

.score-header {
  font-size: 12px;
  color: #000000;
  padding-bottom: 2px;
  text-decoration: underline;
  font-weight: 700;
}

.score-row {
  font-size: 11px;
  color: #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.score-val {
  font-weight: bold;
}

.score-separator {
  background-color: #000000 !important;
  height: 1px;
  margin: 4px 0;
  opacity: 0.8;
}

.score-row-level {
  font-size: 11px;
  color: #000000;
  font-weight: 600;
}

.cert-footer {
  height: 64px;
  padding: 12px 20px;
  background-color: #f8f9fa;
  border-top: 1.5px solid #cbd5e1;
  box-sizing: border-box;
}

.metadata-group {
  display: flex;
  gap: 24px;
}

.metadata-label {
  font-size: 11px;
  color: #000000;
  font-weight: 600;
  line-height: 1.2;
}

.metadata-value {
  font-size: 13px;
  color: #104a8e;
  font-weight: 700;
  margin-top: 2px;
}

.qr-code-icon {
  display: block;
}

.cert-back-container {
  background-color: #ffffff;
  position: relative;
  height: 100%;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

.band-table-container {
  width: 100%;
}

.band-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
  line-height: 1.35;

  th,
  td {
    padding: 5px 6px;
    border: none;
  }

  thead {
    tr {
      border-bottom: 1.5px solid #000000;
    }
  }

  th {
    color: #1e293b;
    font-weight: 700;
  }

  tbody {
    tr {
      border-bottom: 1px solid #cbd5e1;

      &:last-child {
        border-bottom: 1.5px solid #000000;
      }
    }
  }

  td {
    color: #334155;
    vertical-align: middle;
  }

  .descriptor-cell {
    font-size: 11px;
    white-space: normal;
    word-break: break-word;
  }
}

.band-table-note {
  font-size: 10px;
  color: #475569;
  margin-bottom: 0;
  line-height: 1.2;
}
</style>