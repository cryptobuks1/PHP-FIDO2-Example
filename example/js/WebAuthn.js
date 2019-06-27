$(document).ready(function () {

    // check whether current browser supports WebAuthn
    if (!window.PublicKeyCredential) {
        alert("Error: this browser does not support WebAuthn");
    }
});

// Base64 to ArrayBuffer
function bufferDecode(value) {
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

// ArrayBuffer to URLBase64
function bufferEncode(value) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(value)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

function registerUser() {

    username = $("#email").val();
    if (username === "") {
        alert("Please enter a username");
        return;
    }

    $.get(
        'RegisterBegin.php?username=' + username,
        null,
        function (data) {
            return data
        },
        'json')
        .then((credentialCreationOptions) => {

            credentialCreationOptions.publicKey.challenge = bufferDecode(credentialCreationOptions.publicKey.challenge);
            credentialCreationOptions.publicKey.user.id = bufferDecode(credentialCreationOptions.publicKey.user.id);
            if (credentialCreationOptions.publicKey.excludeCredentials) {
                for (let i = 0; i < credentialCreationOptions.publicKey.excludeCredentials.length; i++) {
                    credentialCreationOptions.publicKey.excludeCredentials[i].id = bufferDecode(credentialCreationOptions.publicKey.excludeCredentials[i].id);
                }
            }

            return navigator.credentials.create({
                publicKey: credentialCreationOptions.publicKey
            });
        })
        .then((credential) => {

            let attestationObject = credential.response.attestationObject;
            let clientDataJSON = credential.response.clientDataJSON;
            let rawId = credential.rawId;

            let msg = JSON.stringify({
                id: credential.id,
                rawId: bufferEncode(rawId),
                type: credential.type,
                response: {
                    attestationObject: bufferEncode(attestationObject),
                    clientDataJSON: bufferEncode(clientDataJSON),
                },
            });

            $.post(
                'RegisterComplete.php?username=' + username,
                msg,
                function (data) {
                    return data
                },
                'json')
                .catch((error) => {
                    console.log(JSON.parse(error.responseText));
                    alert("failed to register " + username)
                })
        })
        .then((success) => {
            alert("successfully registered " + username + "!");
        })
        .catch((error) => {
            console.log(JSON.parse(error.responseText));
            alert("failed to register " + username)
        })
}