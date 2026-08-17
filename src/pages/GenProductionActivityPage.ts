import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GenProductionActivityPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openSection(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Section/GenProductionActivity_ListPage');
  }

  async openDirectCardForm(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenProductionActivity_FormPage/add');
  }

  async openServiceTasksCardForm(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenPageForm_ServiceTasks/add');
  }

  async openParticipantModalDirectUrl(): Promise<void> {
    await this.open('https://xlab-analyst-main.poligon.crmgenesis.com/0/Shell/#Card/GenPageForm_ServiceTasks/add[modal=GenProductionActivityParticipant_ModalPage/add]');
  }
}
