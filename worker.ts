import 'dotenv/config';
import { FiveSimAdapter } from "./services/FiveSimAdapter";
import { Pool } from 'pg';
import { ActivationPhoneNumber } from './entities/ActivationPhoneNumber';
import { SmsProvider } from './enums/Sms';
import { SmsManAdapter } from './services/SmsManAdapter';
import { OnlineSimAdapter } from './services/OnlineSimAdapter';
import express, { Request, Response } from 'express';

const connectionString = "postgresql://numaroot:20Bwp@12.ntrAAv@18.132.165.74:5432/numadb?schema=public&sslmode=disable";

const pool = new Pool({
  connectionString: connectionString,
});


const fiveSimAdapter = new FiveSimAdapter(
    process.env.FIVE_SIM_BEARER_TOKEN || "",
    process.env.FIVE_SIM_BASE_URL || ""
);

const smsManAdapter = new SmsManAdapter(
    process.env.SMS_MAN_API_KEY || "",
    process.env.SMS_MAN_BASE_URL || ""
);


const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get("/newSms", async (req: Request, res: Response) => {
  try {

    const operationId = req.query.operation_id as string;
    const code = req.query.code as string;
    console.log("📩 OnlineSim GET Webhook:", operationId,code);

    if (!operationId || !code) {
      // OnlineSim hata istemez
      return res.status(200).send("OK");
    }
    return res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(200).send("OK");
  }
});

const PORT = 3004;

app.listen(PORT, () => {
    console.log(`🚀 Webhook dinleniyor: Port 3004`);
});



console.log("✅ Veritabanına başarıyla bağlandı!");

async function testDatabase() {
  try {

    const res = await pool.query(`
        SELECT 
            apn.*, 
            sp.name as provider_name, 
            sp.is_active as provider_active 
        FROM "activation_phone_number" apn
        INNER JOIN "SmsProvider" sp ON apn.provider_id = sp.id 
        WHERE apn.status = 'PENDING'
    `);
    const numbers = res.rows; 
    const now = new Date();
    for(const row of numbers){
        const item: ActivationPhoneNumber = {
            ...row,
            provider: {
                name: row.provider_name,
                id: row.provider_id,
            } as any
        };
        const expireDate = new Date(item.expires);

        if (expireDate < now) {
            console.log(item.phone+ " Süresi Doldu Provider:"+item.provider.name);
            await pool.query(
            `UPDATE activation_phone_number SET status = 'CANCELED' WHERE process_id = $1`,
            [item.process_id]
            );
            continue; 
        }
        switch(item.provider.name){
            case SmsProvider.FiveSim:
                {
                   const response = await fiveSimAdapter.getSms(item.process_id)
                   if(response.sms.length >0){
                        console.log("received Five Sim");
                        const res = await pool.query(`UPDATE activation_phone_number SET sms = $1 , status = 'RECEIVED' WHERE process_id=$2`,[response.sms[0].text,item.process_id]);
                   }
                   break;
                }
            case SmsProvider.SmsMan:
                {
                    const response = await smsManAdapter.getSms(item.process_id)
                    if(response  && response.sms_code != ""){
                        console.log("received Sms Man");
                        const res = await pool.query(`UPDATE activation_phone_number SET sms = $1 , status = 'RECEIVED' WHERE process_id=$2`,[response.sms_code ,item.process_id]);
                   }
                   break;
                }              
        }
    }
  } catch (err) {
    console.error("❌ Veritabanı bağlantı hatası:", err);
  } finally {
    // Test bittiğinde havuzu kapatmak istersen (sürekli çalışan bir app değilse)
    // await pool.end();
  }
}

async function Loop(){
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    while(true){
        testDatabase();
        await sleep(5000)
    }
}

Loop();