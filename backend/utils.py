def chunk_text_with_pages(
    pages,
    chunk_size=4000
):

    chunks = []

    for page_number, text in pages:

        for i in range(
            0,
            len(text),
            chunk_size
        ):

            chunk = text[i:i + chunk_size]

            chunks.append({
                "page": page_number,
                "text": chunk
            })

    return chunks