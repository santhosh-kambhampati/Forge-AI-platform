import uuid
import chromadb

from sentence_transformers import (
    SentenceTransformer
)

client = chromadb.PersistentClient(
    path="./chroma_db"
)

collection = client.get_or_create_collection(
    name="forge_documents"
)

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

def store_chunks(chunks, document_name):

    texts = [
        chunk["text"]
        for chunk in chunks
    ]

    embeddings = model.encode(
        texts
    ).tolist()

    ids = [
        str(uuid.uuid4())
        for _ in chunks
    ]

    metadatas = [
        {
            "page": chunk["page"],
            "document": document_name
        }
        for chunk in chunks
    ]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas
    )

def retrieve_chunks(query, k=5):

    query_embedding = model.encode(
        [query]
    ).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=k
    )

    retrieved_chunks = []

    for i in range(
        len(results["documents"][0])
    ):

        retrieved_chunks.append({

            "text":
            results["documents"][0][i],

            "page":
            results["metadatas"][0][i]["page"],

            "document":
            results["metadatas"][0][i]["document"]
        })

    return retrieved_chunks