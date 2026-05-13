def get_prompt(text):
    return f"""
Extract the key points from this document in concise bullet points.

{text}
"""