<template>
  <q-card class="admission-voucher shadow-10 no-border">
    <!-- Header Section -->
    <q-card-section class="header-section q-py-md q-px-lg">
      <div class="row items-center no-wrap">
        <!-- Logo Container -->
        <div class="col-auto">
          <div class="logo-container">
            <q-img
              src="https://www.buu.ac.th/wp-content/uploads/2021/04/logo-buu.png"
              class="header-logo"
              fit="contain"
            />
          </div>
        </div>

        <!-- Title Container -->
        <div class="col text-center q-pl-md">
          <div class="text-primary text-weight-bold title-text">
            {{ $t('exam.voucher.title') }}
          </div>
          <div class="text-grey-9 text-weight-medium subtitle-text">
            {{ $t('exam.voucher.subtitle') }}
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator color="grey-3" />

    <!-- Body Section -->
    <q-card-section class="body-section q-pa-xl relative-position overflow-hidden">
      <!-- Watermark Background -->
      <div class="watermark-bg absolute-center text-uppercase no-pointer-events">GET</div>

      <div class="row q-col-gutter-xl items-center content-relative">
        <!-- Profile Picture -->
        <div class="col-12 col-md-4 flex justify-center">
          <div class="profile-photo-container shadow-2">
            <q-img v-if="profileImage" :src="profileImage" class="full-height" fit="cover" />
            <q-icon v-else name="person" size="120px" color="grey-4" class="absolute-center" />
          </div>
        </div>

        <!-- Information Grid -->
        <div class="col-12 col-md-8">
          <div class="row q-col-gutter-y-lg">
            <!-- Left Column Info -->
            <div class="col-12 col-sm-6">
              <div class="info-group q-mb-md">
                <div class="label">{{ $t('exam.voucher.fields.testTakerId') }}</div>
                <div class="value text-primary">{{ testTakerId }}</div>
              </div>
              <div class="info-group q-mb-md">
                <div class="label">{{ $t('exam.voucher.fields.nameSurname') }}</div>
                <div class="value text-primary">{{ nameSurname }}</div>
              </div>
              <div class="info-group q-mb-md">
                <div class="label">{{ $t('exam.voucher.fields.citizenId') }}</div>
                <div class="value text-primary">{{ citizenId }}</div>
              </div>
              <div class="info-group">
                <div class="label">{{ $t('exam.voucher.fields.testSession') }}</div>
                <div class="value text-primary">{{ testSession }}</div>
              </div>
            </div>

            <!-- Right Column Info -->
            <div class="col-12 col-sm-6">
              <div class="info-group q-mb-md">
                <div class="label">{{ $t('exam.voucher.fields.testDate') }}</div>
                <div class="value text-primary">{{ testDate }}</div>
              </div>
              <div class="info-group q-mb-md">
                <div class="label">{{ $t('exam.voucher.fields.time') }}</div>
                <div class="value text-primary">{{ timeRange }}</div>
              </div>
              <div class="info-group q-mb-md">
                <div class="label">{{ $t('exam.voucher.fields.venue') }}</div>
                <div class="value text-primary">{{ venue }}</div>
              </div>
              <div class="info-group">
                <div class="label">{{ $t('exam.voucher.fields.seatNumber') }}</div>
                <div class="value text-primary">{{ seatNumber }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>

    <!-- Footer Section -->
    <q-card-section class="footer-section bg-grey-2 q-py-md flex flex-center column">
      <div class="barcode-container q-mb-xs">
        <!-- Using a placeholder barcode image -->
        <q-img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/UPC-A-barcode.svg/640px-UPC-A-barcode.svg.png"
          class="barcode-img"
          fit="fill"
        />
      </div>
      <div class="text-caption text-weight-bolder text-uppercase tracking-widest">
        {{ barcodeValue }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
interface Props {
  profileImage?: string;
  testTakerId: string;
  nameSurname: string;
  citizenId: string;
  testSession: string;
  testDate: string;
  timeRange: string;
  venue: string;
  seatNumber: string;
  barcodeValue: string;
}

withDefaults(defineProps<Props>(), {
  profileImage: '',
  testTakerId: '66100001',
  nameSurname: 'Mr. Somdream Jaidee',
  citizenId: '1-1234-12345-12-1',
  testSession: 'X/XXXX',
  testDate: '15 May 2026',
  timeRange: '08.00 AM - 10.00 AM',
  venue: 'QS1, Burapha University',
  seatNumber: 'A1',
  barcodeValue: 'ENG2026-001',
});
</script>

<style lang="scss" scoped>
.admission-voucher {
  max-width: 900px;
  margin: 0 auto;
  border-radius: 16px;
  background-color: #fcfdfe;
  border: 1px solid $grey-3;
  overflow: hidden;

  .header-section {
    background: white;

    .header-logo {
      width: 140px;
    }

    .title-text {
      font-size: 1.25rem;
      letter-spacing: 0.5px;
    }

    .subtitle-text {
      font-size: 1.1rem;
      letter-spacing: 2px;
      margin-top: 4px;
    }
  }

  .body-section {
    min-height: 400px;
    background-color: #f8fbff;

    .content-relative {
      z-index: 1;
    }

    .watermark-bg {
      font-size: 18rem;
      font-weight: 900;
      color: rgba($primary, 0.03);
      z-index: 0;
      letter-spacing: -5px;
    }

    .profile-photo-container {
      width: 200px;
      height: 250px;
      border: 4px solid white;
      border-radius: 4px;
      background-color: #e3f2fd;
      overflow: hidden;
    }

    .info-group {
      .label {
        font-size: 0.85rem;
        color: $grey-7;
        font-weight: 500;
        margin-bottom: 2px;
      }

      .value {
        font-size: 1.1rem;
        font-weight: 600;
        letter-spacing: 0.3px;
      }
    }
  }

  .footer-section {
    .barcode-container {
      background: white;
      padding: 4px;
      border-radius: 4px;

      .barcode-img {
        width: 280px;
        height: 60px;
      }
    }

    .tracking-widest {
      letter-spacing: 4px;
    }
  }
}

// Mobile Responsiveness
@media (max-width: $breakpoint-xs-max) {
  .admission-voucher {
    .header-section {
      .title-text {
        font-size: 1rem;
      }
      .subtitle-text {
        font-size: 0.9rem;
      }
    }

    .body-section {
      .watermark-bg {
        font-size: 10rem;
      }
      .profile-photo-container {
        width: 160px;
        height: 200px;
      }
    }
  }
}
</style>
