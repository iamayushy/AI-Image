
import express from 'express';
import {createClient} from "@supabase/supabase-js";
import 'dotenv/config'

const supabase = createClient(process.env.SUPER_URL, process.env.SUPER_KEY)
const BUCKER_NAME = "FLUX_IMAGE";
const FLUX_KEY = process.env.FLUX_KEY;

const app = express();
const PORT = process.env.PORT || 8080
app.use(express.json());

const generateUniqueName = () => {
    const randomString = Math.random().toString(36).substring(2, 7);
    return `${BUCKER_NAME}_${randomString}`
}
const upload = async (buffer, name) => {
    const {data, error} = await supabase.storage.from(BUCKER_NAME).upload(`hugging/${name}.jpg`, buffer, {});
    if (error) {
        console.log("UPLOAD FAILED", {error})
        return {
            success: false,
        }
    }
    if (data) {
        const response = supabase.storage.from(BUCKER_NAME).getPublicUrl(`hugging/${name}.jpg`);
        return {
            url: response.data.publicUrl,
            success: true
        }
    }
}

async function query(data) {
    console.log("loading.....")
    const response = await fetch(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
        {
            headers: {
                Authorization: `Bearer ${FLUX_KEY}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(data),
        }
    );
    console.log("Image generation started...")
    const arrayBuffer = await response.arrayBuffer();    
    return arrayBuffer;
}

app.post("/", async(req, res) => {
    try {
        const body = req.body;
        const response = await query(body);
        const buffer = Buffer.from(response);
        const name = generateUniqueName();
        const app = await upload(buffer, name)
        res.send(app)   
    } catch (error) {
        res.send({
            success: false,
            error
        });
    }
})

app.listen(PORT, () => {
    console.log(`upload app listening at http://localhost:${PORT}`)
})


