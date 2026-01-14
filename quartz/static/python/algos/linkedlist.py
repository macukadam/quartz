class Node:
    def __init__(self, value=0, next=None):
        self.value = value
        self.next = next

    def __repr__(self):
        return f"Node({self.value})"

    def print_list(self):
        current = self
        values = []
        while current:
            values.append(str(current.value))
            current = current.next
        print(" -> ".join(values))

    def create_linkedlist(values):
        if not values:
            return None
        head = Node(values[0])
        current = head
        for value in values[1:]:
            current.next = Node(value)
            current = current.next
        return head
