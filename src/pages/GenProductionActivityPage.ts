import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { getShellUrl } from '../config/environment';

export class GenProductionActivityPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openSection(): Promise<void> {
    await this.open(getShellUrl('#Section/GenProductionActivity_ListPage'));
  }

  async openDirectCardForm(): Promise<void> {
    await this.open(getShellUrl('#Card/GenProductionActivity_FormPage/add'));
  }

  async openServiceTasksCardForm(): Promise<void> {
    await this.open(getShellUrl('#Card/GenPageForm_ServiceTasks/add'));
  }

  async openParticipantModalDirectUrl(): Promise<void> {
    await this.open(getShellUrl('#Card/GenPageForm_ServiceTasks/add[modal=GenProductionActivityParticipant_ModalPage/add]'));
  }

  async openQualityControlCard(): Promise<void> {
    await this.open(getShellUrl('#Card/GenQualityControlResults_FormPage/add'));
  }
}
