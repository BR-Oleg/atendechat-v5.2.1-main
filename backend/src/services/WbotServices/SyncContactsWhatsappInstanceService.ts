import { QueryTypes } from "sequelize";
import { endOfDay } from "date-fns";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import ListAllContactsService from "../ContactServices/ListAllContactsService";

const SyncContactsWhatsappInstanceService = async (
  whatsappId: number,
  tenantId: number
): Promise<void> => {
  const wbot = getWbot(whatsappId);

  let contacts;

  try {
    contacts = await wbot.getContacts();
  } catch (err) {
    logger.error(
      `Could not get whatsapp contacts from phone. Check connection page. | Error: ${err}`
    );
  }

  if (!contacts) {
    throw new AppError("ERR_CONTACTS_NOT_EXISTS_WHATSAPP", 404);
  }

  try {
    const listcontacts = await ListAllContactsService(tenantId)
    const dataArray = contacts
      .filter(({ name, pushname, isGroup }) => (name || pushname) && !isGroup)
      .map(({ name, pushname, number }) => ({
        name: name || pushname,
        number,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      const importar = dataArray.filter(item => {
        let validacao = listcontacts.findIndex(c => c.number == item.number)
        return validacao < 0
      })
    if (importar.length) {
      await Contact.bulkCreate(importar, {
        fields: ["number", "name", "tenantId", "createdAt", "updatedAt"],
        // updateOnDuplicate: ["number"]
      });
      console.log("sql contact");
    }
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

export default SyncContactsWhatsappInstanceService;
