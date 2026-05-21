interface Options {
  enabled: boolean;
}

export class UpdateInProgressReminderConfigDto {
  readonly enabled: boolean;

  constructor(options: Options) {
    this.enabled = options.enabled;
  }

  static execute(values: Record<string, any>): [string?, UpdateInProgressReminderConfigDto?] {
    if (values.enabled === undefined) {
      return ['enabled es requerido'];
    }

    const enabled = values.enabled === true || `${values.enabled}`.toLowerCase() === 'true';
    return [undefined, new UpdateInProgressReminderConfigDto({ enabled })];
  }
}
