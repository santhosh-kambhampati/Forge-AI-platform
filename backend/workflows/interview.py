def get_prompt(text):
    return f"""
Generate interview questions and answers from this document.

{text}
"""