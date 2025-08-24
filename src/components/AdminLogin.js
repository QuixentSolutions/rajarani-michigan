import React, { useState } from 'react';

const AdminLogin = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState('');

    const styles = {
        loginContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            // backgroundColor: '#f8f9fa',
            // background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            background: "url('/public/bg-2.jpeg') no-repeat center center fixed",
            backgroundSize: 'cover',
            fontFamily: 'Arial, sans-serif',
        },
        loginBox: {
            padding: '2.5em',
            backgroundColor: '#fff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            width: '400px',
            textAlign: 'center',
        },
        logo: {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '30px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
        },
        inputGroup: {
            marginBottom: '20px',
            textAlign: 'left',
        },
        label: {
            display: 'block',
            marginBottom: '8px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '600',
            color: '#34495e',
            fontSize: '1em',
            letterSpacing: '0.3px',
            transition: 'all 0.3s ease',
        },
        input: {
            width: '100%',
            padding: '14px 20px',
            border: '2px solid #e1e8ed',
            borderRadius: '12px',
            boxSizing: 'border-box',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '1em',
            fontWeight: '400',
            backgroundColor: '#fff',
            color: '#333',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        inputFocus: {
            borderColor: '#FFA500',
            outline: 'none',
            boxShadow: '0 0 0 4px rgba(255, 165, 0, 0.15), 0 4px 12px rgba(255, 165, 0, 0.1)',
            transform: 'translateY(-2px)',
        },
        button: {
            width: '100%',
            padding: '18px 35px',
            border: 'none',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FFA500, #FF8C00)',
            color: 'white',
            fontSize: '1.15em',
            fontWeight: '600',
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            marginTop: '20px',
            boxShadow: '0 6px 20px rgba(255, 165, 0, 0.3)',
        },
        buttonDisabled: {
            background: '#ccc',
            cursor: 'not-allowed',
        },
        error: {
            background: 'linear-gradient(135deg, #ffc0cb 0%, #ff69b4 100%)',
            color: '#8B0000',
            padding: '15px',
            borderRadius: '10px',
            marginTop: '20px',
            fontSize: '14px',
        },
        loading: {
            color: '#FFA500',
            fontSize: '14px',
            marginTop: '10px',
        }
    };

    // Hardcoded credentials validation
    const validateCredentials = (username, password) => {
        if (username === 'admin' && password === 'QuiX3nt!') {
            const token = 'Basic ' + btoa(`${username}:${password}`);
            return { success: true, token };
        } else {
            return { success: false, error: 'Invalid username or password' };
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Basic validation
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            setIsLoading(false);
            return;
        }

        // Simulate loading for better UX
        setTimeout(() => {
            const result = validateCredentials(username, password);
            
            if (result.success) {
                // Store token in sessionStorage for session persistence
                sessionStorage.setItem('adminToken', result.token);
                // Pass token to parent component
                onLoginSuccess(result.token);
            } else {
                setError(result.error);
            }
            setIsLoading(false);
        }, 500);
    };

    const getInputStyle = (inputName) => ({
        ...styles.input,
        ...(focusedInput === inputName ? styles.inputFocus : {}),
    });

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div style={styles.loginContainer}>
            <div style={styles.loginBox}>
                <img src="/public/black_logo.jpeg" alt="Raja Rani Logo" style={{ width: '100px', marginBottom: '20px' }} />
                <h1 style={styles.logo}>Admin Panel</h1>
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Username</label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onFocus={() => setFocusedInput('username')}
                            onBlur={() => setFocusedInput('')}
                            onKeyPress={handleKeyPress}
                            style={getInputStyle('username')}
                            disabled={isLoading}
                            required
                        />
                        {/* Input focus glow effect */}
                        <style jsx>{`
                            .form-group.focused::before {
                                opacity: 1;
                            }
                        `}</style>
                        <div className="form-group-glow" style={{ opacity: focusedInput === 'username' ? 1 : 0 }}></div>
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedInput('password')}
                            onBlur={() => setFocusedInput('')}
                            onKeyPress={handleKeyPress}
                            style={getInputStyle('password')}
                            disabled={isLoading}
                            required
                        />
                        {/* Input focus glow effect */}
                        <div className="form-group-glow" style={{ opacity: focusedInput === 'password' ? 1 : 0 }}></div>
                    </div>
                    <button 
                        type="submit"
                        style={{
                            ...styles.button,
                            ...(isLoading ? styles.buttonDisabled : {})
                        }}
                        disabled={isLoading}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.target.style.transform = 'translateY(-3px)';
                                e.target.style.boxShadow = '0 12px 30px rgba(255, 165, 0, 0.4)';
                                e.target.style.background = 'linear-gradient(135deg, #e69500, #cc7a00)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading) {
                                e.target.style.transform = 'none';
                                e.target.style.boxShadow = '0 6px 20px rgba(255, 165, 0, 0.3)';
                                e.target.style.background = 'linear-gradient(135deg, #FFA500, #FF8C00)';
                            }
                        }}
                        onMouseDown={(e) => {
                            if (!isLoading) {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(255, 165, 0, 0.3)';
                            }
                        }}
                        onMouseUp={(e) => {
                            if (!isLoading) {
                                e.target.style.transform = 'translateY(-3px)';
                                e.target.style.boxShadow = '0 12px 30px rgba(255, 165, 0, 0.4)';
                            }
                        }}
                    >
                        {isLoading ? 'Logging in...' : 'Login to Admin Panel'}
                    </button>
                </form>
                
                {isLoading && (
                    <div style={styles.loading}>Validating credentials...</div>
                )}
                
                {error && (
                    <div style={styles.error}>{error}</div>
                )}
                
                
                
            </div>
        </div>
    );
};

export default AdminLogin;