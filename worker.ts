import 'dotenv/config';
import { FiveSimAdapter } from "./services/FiveSimAdapter";
import { Pool } from 'pg';
import { ActivationPhoneNumber } from './entities/ActivationPhoneNumber';
import { SmsProvider } from './enums/Sms';
import { SmsManAdapter } from './services/SmsManAdapter';
import { OnlineSimAdapter } from './services/OnlineSimAdapter';
import express, { Request, Response } from 'express';
import { NumaAdapter } from './services/NumaAdapter';
import twilio from 'twilio';

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

const numaAdapter = new NumaAdapter(
    process.env.NUMA_BASE_URL || ""
);


const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get("/newSms", async (req: Request, res: Response) => {
  try {

    const process_id = req.query.operation_id as string;
    const smsCode = req.query.code as string;

    if (process_id && smsCode) {
      await numaAdapter.successSmsProductWithSms(smsCode,process_id)
      return res.status(200).send("OK");
    }
    return res.status(200).send("OK");
  } catch (err) {
    return res.status(200).send(err);
  }
});

app.post('/newSmsTwilio',(req: Request,res: Response)=>{
    console.log("İstek Geldi.")
    const signatureHeader = req.headers['x-twilio-signature'];
    const twilioSignature = Array.isArray(signatureHeader) ? signatureHeader[0] : "";    
    const params = req.body;
    const url = process.env.TWILIO_SMS_CALLBACK_URL || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";

    const requestIsValid = twilio.validateRequest(
        authToken,
        twilioSignature,
        url,
        params
    )
    if (!requestIsValid) {
        console.log("Doğrulanmadı.")
        return res.status(403).send('Sahte İstek Engellendi!');
    }
    console.log("SMS geldi")
    console.log(req.body)
})

const PORT = 3004;

app.listen(PORT, () => {
    console.log(`Webhook dinleniyor: Port 3004`);
});

async function smsCheck() {
  try {
    // 1. Veritabanından PENDING olanları çek
    const res = await pool.query(`
        SELECT 
            apn.*, 
            sp.name as provider_name 
        FROM "activation_phone_number" apn
        INNER JOIN "SmsProvider" sp ON apn.provider_id = sp.id 
        WHERE apn.status = 'PENDING'
    `);
    
    const pendingNumbers = res.rows;
    if (pendingNumbers.length === 0) return; // Bekleyen yoksa çık

    const now = new Date();

    let fiveSimOrderMap = new Map();
    const hasFiveSim = pendingNumbers.some(row => row.provider_name === SmsProvider.FiveSim);

    if (hasFiveSim) {
        try {
            const historyResponse = await fiveSimAdapter.getLastOrders(100); 
              if(historyResponse && historyResponse.Data) {
                historyResponse.Data.forEach(order => {
                    fiveSimOrderMap.set(order.id.toString(), order); 
                });
            }
        } catch (apiErr) {
            console.error("5sim History API hatası:", apiErr);
        }
    }
    
    for (const row of pendingNumbers) {
        const item = {
            ...row,
            provider: { name: row.provider_name, id: row.provider_id }
        };

        // 1. Süre Kontrolü (Yerel)
        const expireDate = new Date(item.expires);

        if (expireDate < now) {
            console.log("iptal olacak"+item.phone);
            await numaAdapter.cancelProduct(item.phone,item.user_id)
            continue; 
        }

        switch (item.provider.name) {
            case SmsProvider.FiveSim:
                {
                   const apiOrder = fiveSimOrderMap.get(item.process_id.toString());

                   if (apiOrder) {
                       if (apiOrder.sms && apiOrder.sms.length > 0) {
                           const smsCode = apiOrder.sms[0].code; 
                           await numaAdapter.successSmsProductWithSms(smsCode,item.process_id)
                       } else if (apiOrder.status === 'CANCELED' || apiOrder.status === 'TIMEOUT') {
                           await numaAdapter.cancelProduct(item.phone,item.user_id)
                       }
                   }
                   break;
                }

            case SmsProvider.SmsMan:
                {
                    try {
                        const response = await smsManAdapter.getSms(item.process_id);
                        if (response && response.sms_code) {
                            console.log("received Sms Man");
                            const smsCode= response.sms_code
                            await numaAdapter.successSmsProductWithSms(smsCode,item.process_id)
                        }
                    } catch (e) {
                        console.error("SmsMan check error:", e);
                    }
                    break;
                }    
            case SmsProvider.OnlineSim:
            {
                try {
                    const smsCode = "test"
                    console.log("received Sms Man");
                    await numaAdapter.successSmsProductWithSms(smsCode,item.process_id)
                    
                } catch (e) {
                    console.error("SmsMan check error:", e);
                }
                break;
            }           
        }
    }
  } catch (err) {

  }
}

async function Loop(){
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    while(true){
        smsCheck();
        await sleep(2000)
    }
}

Loop();