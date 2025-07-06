import { z } from "zod";
const WithTypeValue = z.object({
    "@type": z.string().optional(),
    "@value": z.string().optional()
});
const WithLangValue = z.object({
    "@language": z.string(),
    "@value": z.string()
});
const Creater = z.object({
    "@id": z.string(),
    "@type": z.string(),
    "personIdentifier": z.array(WithTypeValue),
    "foaf:name": z.array(WithLangValue)
});
const DctermsPublisher = z.object({
    "dc:publisher": z.string(),
    "publicationPlace": z.string(),
    "prism:publicationDate": z.string()
})
const BookJSONLDSchema = z.object({
    "@id": z.string(), // このjsonのurl
    "@type": z.string(), // Book
    "productIdentifier": z.array(WithTypeValue).optional(), // ISBN, etc...
    "resoureceType": z.string().optional(), // 図書(book), etc...
    "dc:title": z.array(WithLangValue),
    "dc:language": z.string(),
    "creater": z.array(Creater).optional(), //取得は dc:creater の方が無難か
    "dc:date": z.string(), // year
    "dc:creator": z.string().optional(), // こっちを使う
    "publicationCounrtyCode": z.string().optional(), // ja, etc...
    "dcterms:publisher": z.array(DctermsPublisher), // 出版社とか出版の年月
    "dc:subject": z.array(z.string()), // NDC
    "cinii:size": z.string(), // 本の大きさ 版元ドットコムから写真取得とかしたら面白いかも
   // "url": {"@id": string}[] // productIdentifierのURIと同じでは？
   "dcterms:subject": z.array(z.object({
        "subjectScheme": z.string(),
        "notation": z.array(WithLangValue)
   })).optional(),
   "dinii:note": z.array(z.object({"@value": z.string()})).optional()
});


// const BookJSONLDSchema = z.object({
//     "@id": z.string(), // このjsonのurl
// });

type BookJSONLD = z.infer<typeof BookJSONLDSchema>;

async function book_parser(url: string): Promise<BookJSONLD> {
  const response: any = await fetch(url);
  if (!response.ok) throw new Error("HTTP Error ${response.status}")
  const json = await response.json();
  const data: BookJSONLD = 
    BookJSONLDSchema
    .parse(json)
  ;
  return data
}

export async function parseCiNii(url: string): Promise<BookJSONLD> {
  return await book_parser(url);
}