import type { Reporter, FullResult } from '@playwright/test/reporter';
import generateAndSendReport from './generateAndSendReport';

class HtmlSummaryReporter implements Reporter {
  async onEnd(result: FullResult) {
    try {
      await generateAndSendReport();
    } catch (err) {
      console.error('❌ [HtmlSummaryReporter] Ошибка генерации отчета:', err);
    }
  }
}

export default HtmlSummaryReporter;
