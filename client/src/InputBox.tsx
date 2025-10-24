import React, { useState } from 'react';
import './InputBox.css';

const handleKeyDown = function (e: React.KeyboardEvent<HTMLFormElement>) {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'inherit';
    target.style.height = `${target.scrollHeight}px`;
    // In case you have a limitation
    // e.target.style.height = `${Math.min(e.target.scrollHeight, limit)}px`;
};

function InputBox(handleSubmit: (value: string) => void) {
    const [value, setValue] = useState('');
    return (
        <div className="input-box">
            <form
                className='input-form'
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(value);
                    setValue('');
                }}
                onKeyDown={handleKeyDown}
            >
                <textarea
                    value={value}
                    autoFocus={true}
                    placeholder="Type your message here..."
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.shiftKey) {
                            e.preventDefault();
                            setValue(value + '\n');
                        }
                        else if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmit(value);
                            setValue('');
                        }

                    }
                    }
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

export default InputBox;