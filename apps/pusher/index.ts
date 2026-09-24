import client from "@repo/db/client";
import {xAddBulk} from '@repo/redis/client'

async function main(){
    try {
        let websites = await client.website.findMany({
            select: {
                url: true,
                id: true
            }
        });
        console.log(`Pushed ${websites.length} websites to queue`);
        await xAddBulk(websites.map(w => ({
            url: w.url,
            id: w.id
        })));
    } catch (err) {
        console.error("Error in pusher cycle:", err);
    }
}

main();
setInterval(()=> {
    main();
}, 5 * 60 * 1000);