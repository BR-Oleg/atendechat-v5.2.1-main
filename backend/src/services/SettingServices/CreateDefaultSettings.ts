import Setting from "../../models/Setting";

const CreateDefaultSettings = async (
    tenantId: number | string
): Promise<Setting[] | undefined> => {
    const settings01: Setting = await Setting.create({
        key: 'userCreation',
        value: 'disabled',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: Number(tenantId)
    });
    const settings02: Setting = await Setting.create({
        key: 'NotViewTicketsQueueUndefined',
        value: 'disabled',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: Number(tenantId)
    });
    const settings03: Setting = await Setting.create({
        key: 'NotViewTicketsChatBot',
        value: 'disabled',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: Number(tenantId)
    });
    const settings04: Setting = await Setting.create({
        key: 'DirectTicketsToWallets',
        value: 'disabled',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: Number(tenantId)
    });
    const settings05: Setting = await Setting.create({
        key: 'DirectTicketsToWallets',
        value: 'disabled',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: Number(tenantId)
    });
    const settings06: Setting = await Setting.create({
        key: 'NotViewAssignedTickets',
        value: 'disabled',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: Number(tenantId)
    });
    const settings07: Setting = await Setting.create({
        key: 'botTicketActive',
        value: 'disabled',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: Number(tenantId)
    });
    const settings08: Setting = await Setting.create({
        key: 'callRejectMessage',
        value: 'disabAs chamadas de voz e vídeo estão desabilitas para esse WhatsApp, favor enviar uma mensagem de textoled',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: Number(tenantId)
    });
    const settings09: Setting = await Setting.create({
        key: 'ignoreGroupMsg',
        value: 'disabled',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: Number(tenantId)
    });
    var retorno: Setting[] = [];
    retorno.push(settings01);
    retorno.push(settings02);
    retorno.push(settings03);
    retorno.push(settings04);
    retorno.push(settings05);
    retorno.push(settings06);
    retorno.push(settings07);
    retorno.push(settings08);
    retorno.push(settings09);
    return retorno;
};

export default CreateDefaultSettings;