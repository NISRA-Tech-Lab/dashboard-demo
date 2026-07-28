export function insertValue (element_id, value) {
    document.getElementById(element_id) ? document.getElementById(element_id).textContent = value : null;
}