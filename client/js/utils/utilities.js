  // Formatar temps transcorregut des de la data passada com a paràmetre
// Us de la funcio: formatTimeAgo('2021-09-01T12:00:00.000Z') => '2 dies'
export function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffYear > 0) {
        return `${diffYear} ${diffYear === 1 ? 'any' : 'anys'}`;
    }
    if (diffMonth > 0) {
        return `${diffMonth} ${diffMonth === 1 ? 'mes' : 'mesos'}`;
    }
    if (diffWeek > 0) {
        return diffWeek === 2 ? 'quinze dies' : `${diffWeek} ${diffWeek === 1 ? 'setmana' : 'setmanes'}`;
    }
    if (diffDay > 0) {
        return `${diffDay} ${diffDay === 1 ? 'dia' : 'dies'}`;
    }
    if (diffHour > 0) {
        return `${diffHour} ${diffHour === 1 ? 'hora' : 'hores'}`;
    }
    if (diffMin > 0) {
        return `${diffMin} ${diffMin === 1 ? 'minut' : 'minuts'}`;
    }
    return 'ara mateix';
}